'use server'

import supabase from './supabase'
import { type DimensionScores } from '../_lib/dimensionScores'

const IMAGE_MODEL = 'black-forest-labs/flux.2-flex'
const TEXT_MODEL_CREATIVE = 'mistralai/mistral-small-creative'
const SVG_ANIMATION_MODEL = 'anthropic/claude-sonnet-4-6'

export type AssetTask = 'summary' | 'hex_color' | 'image' | 'svg' | 'animation'

function modelForTask(task: AssetTask): string {
  switch (task) {
    case 'summary':
    case 'hex_color': return TEXT_MODEL_CREATIVE
    case 'image': return IMAGE_MODEL
    case 'svg':
    case 'animation': return SVG_ANIMATION_MODEL
  }
}

export interface SaveAssetResult {
  success: boolean
  assetId?: string
  error?: string
}

/** Create a pending asset record and return its ID */
export async function createAssetRecord(
  sessionId: string,
  task: AssetTask,
  trait: string | null,
  dimensionWeights: DimensionScores | null
): Promise<string> {
  const { data, error } = await supabase
    .from('generated_assets')
    .insert({
      session_id: sessionId,
      task,
      trait,
      dimension_weights: dimensionWeights,
      model: modelForTask(task),
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) throw new Error(error.message)
  return data.id
}

/** Save a binary image (URL or data URI) to Supabase Storage and mark asset done */
export async function saveBinaryAsset(
  assetId: string,
  sessionId: string,
  imageData: string // URL or data URI
): Promise<SaveAssetResult> {
  try {
    let buffer: Buffer
    let ext = 'png'

    if (imageData.startsWith('data:')) {
      const match = imageData.match(/^data:image\/(\w+);base64,(.+)$/)
      if (!match) return { success: false, error: 'Invalid data URI' }
      ext = match[1]
      buffer = Buffer.from(match[2], 'base64')
    } else if (imageData.startsWith('http')) {
      const res = await fetch(imageData)
      if (!res.ok) return { success: false, error: `Download failed: HTTP ${res.status}` }
      const contentType = res.headers.get('content-type') ?? ''
      if (contentType.includes('jpeg') || contentType.includes('jpg')) ext = 'jpg'
      else if (contentType.includes('webp')) ext = 'webp'
      buffer = Buffer.from(await res.arrayBuffer())
    } else {
      return { success: false, error: 'Unknown image format' }
    }

    const path = `${sessionId}/${assetId}.${ext}`
    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(path, buffer, { contentType: `image/${ext}` })

    if (uploadError) return { success: false, error: uploadError.message }

    const { data: { publicUrl } } = supabase.storage.from('assets').getPublicUrl(path)

    await supabase
      .from('generated_assets')
      .update({ status: 'done', storage_url: publicUrl })
      .eq('id', assetId)

    await supabase
      .from('sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    return { success: true, assetId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase
      .from('generated_assets')
      .update({ status: 'error', error_message: message })
      .eq('id', assetId)
    return { success: false, error: message }
  }
}

/** Save text content (summary, hex, SVG, animation) directly to the record */
export async function saveTextAsset(
  assetId: string,
  sessionId: string,
  content: string
): Promise<SaveAssetResult> {
  try {
    await supabase
      .from('generated_assets')
      .update({ status: 'done', content })
      .eq('id', assetId)

    await supabase
      .from('sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    return { success: true, assetId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    await supabase
      .from('generated_assets')
      .update({ status: 'error', error_message: message })
      .eq('id', assetId)
    return { success: false, error: message }
  }
}

/** Mark an asset as errored */
export async function markAssetError(assetId: string, message: string): Promise<void> {
  await supabase
    .from('generated_assets')
    .update({ status: 'error', error_message: message })
    .eq('id', assetId)
}
