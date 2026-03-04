'use server'

import { createAssetRecord, saveTextAsset, markAssetError } from './saveAssetToStorage'
import { type DimensionScores } from '../_lib/dimensionScores'

const MODEL = 'mistralai/mistral-small-creative'

export interface GenerateHexColorResult {
  success: boolean
  assetId?: string
  colors?: string[]
  error?: string
}

export async function generateHexColor(
  sessionId: string,
  dimensionWeights: DimensionScores,
  brandSummary: string
): Promise<GenerateHexColorResult> {
  let assetId: string | undefined

  try {
    assetId = await createAssetRecord(sessionId, 'hex_color', null, dimensionWeights)

    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a brand color expert. Given a brand personality summary, return 1–3 hex color codes that best represent the brand. Return ONLY a valid JSON array of hex strings, e.g. ["#2D1B69","#E8C547"]. No explanation, no markdown.`,
          },
          {
            role: 'user',
            content: `Brand summary: ${brandSummary}`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`OpenRouter ${res.status}: ${text}`)
    }

    const data = await res.json()
    const raw = data.choices?.[0]?.message?.content?.trim()
    if (!raw) throw new Error('No content in response')

    // Strip markdown fences if present
    const jsonStr = raw.replace(/```(?:json)?\s*/g, '').replace(/```/g, '').trim()
    const colors: string[] = JSON.parse(jsonStr)
    if (!Array.isArray(colors)) throw new Error('Response is not an array')

    await saveTextAsset(assetId, sessionId, JSON.stringify(colors))
    return { success: true, assetId, colors }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generateHexColor]', err)
    if (assetId) await markAssetError(assetId, message)
    return { success: false, error: message }
  }
}
