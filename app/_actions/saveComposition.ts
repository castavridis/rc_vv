'use server'

import supabase from './supabase'

export interface CanvasElement {
  id: string
  storageUrl: string
  x: number
  y: number
  width: number
  height: number
}

export interface SaveCompositionResult {
  success: boolean
  compositionId?: string
  thumbnailUrl?: string
  error?: string
}

export async function saveComposition(
  sessionId: string,
  canvasState: CanvasElement[],
  thumbnailBase64: string // base64 PNG from html2canvas
): Promise<SaveCompositionResult> {
  try {
    const compositionId = crypto.randomUUID()

    // Upload thumbnail to Supabase Storage
    const buffer = Buffer.from(thumbnailBase64, 'base64')
    const path = `${sessionId}/${compositionId}.png`

    const { error: uploadError } = await supabase.storage
      .from('compositions')
      .upload(path, buffer, { contentType: 'image/png' })

    if (uploadError) throw new Error(uploadError.message)

    const { data: { publicUrl } } = supabase.storage
      .from('compositions')
      .getPublicUrl(path)

    // Insert compositions record
    const { error: dbError } = await supabase
      .from('compositions')
      .insert({
        id: compositionId,
        session_id: sessionId,
        canvas_state: canvasState,
        thumbnail_url: publicUrl,
      })

    if (dbError) throw new Error(dbError.message)

    // Touch session updated_at
    await supabase
      .from('sessions')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', sessionId)

    return { success: true, compositionId, thumbnailUrl: publicUrl }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[saveComposition]', err)
    return { success: false, error: message }
  }
}

export async function getCompositions(sessionId: string) {
  const { data } = await supabase
    .from('compositions')
    .select('id, canvas_state, thumbnail_url, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
  return data ?? []
}
