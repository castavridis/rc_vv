'use server'

import { createAssetRecord, saveBinaryAsset, markAssetError } from './saveAssetToStorage'
import { contentForTraitAndLevel, levelForTrait } from '../_lib/bflPrompt'
import { type DimensionScores } from '../_lib/dimensionScores'
import { type Trait } from '../_lib/brand'

const MODEL = 'black-forest-labs/flux.2-flex'

export interface GenerateImageResult {
  success: boolean
  assetId?: string
  storageUrl?: string
  error?: string
}

export async function generateImage(
  sessionId: string,
  trait: Trait,
  dimensionWeights: DimensionScores,
  brandSummary?: string
): Promise<GenerateImageResult> {
  let assetId: string | undefined

  try {
    const level = levelForTrait(trait, dimensionWeights)
    const prompt = contentForTraitAndLevel(trait, level, brandSummary)

    assetId = await createAssetRecord(sessionId, 'image', trait, dimensionWeights)

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image'],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`OpenRouter ${res.status}: ${text}`)
    }

    const data = await res.json()
    const message = data.choices?.[0]?.message

    // Extract image URL or data URI
    let imageData: string | null = null
    if (message?.images?.length > 0) {
      imageData = message.images[0].image_url?.url ?? null
    } else if (typeof message?.content === 'string' && message.content.startsWith('data:')) {
      imageData = message.content
    } else if (Array.isArray(message?.content)) {
      for (const part of message.content) {
        const url = part.image_url?.url || part.imageUrl?.url
        if (url) { imageData = url; break }
      }
    }

    if (!imageData) throw new Error('No image in response')

    const result = await saveBinaryAsset(assetId, sessionId, imageData)
    if (!result.success) throw new Error(result.error)

    return { success: true, assetId, storageUrl: result.assetId }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generateImage]', err)
    if (assetId) await markAssetError(assetId, message)
    return { success: false, error: message }
  }
}
