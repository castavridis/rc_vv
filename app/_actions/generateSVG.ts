'use server'

import { createAssetRecord, saveTextAsset, markAssetError } from './saveAssetToStorage'
import { type DimensionScores } from '../_lib/dimensionScores'
import { type Trait } from '../_lib/brand'
import { levelForTrait } from '../_lib/bflPrompt'

const MODEL = 'anthropic/claude-sonnet-4-6'

export interface GenerateSVGResult {
  success: boolean
  assetId?: string
  svg?: string
  error?: string
}

export async function generateSVG(
  sessionId: string,
  trait: Trait,
  dimensionWeights: DimensionScores,
  brandSummary?: string
): Promise<GenerateSVGResult> {
  let assetId: string | undefined

  try {
    const level = levelForTrait(trait, dimensionWeights)
    const summaryContext = brandSummary ? `Brand context: ${brandSummary}\n\n` : ''

    assetId = await createAssetRecord(sessionId, 'svg', trait, dimensionWeights)

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
            content: `You are a generative SVG designer. Create a single self-contained SVG (300×300) using only geometric shapes (circles, squares, triangles, lines). The SVG must use CSS custom properties (--color-primary, --color-secondary, --scale, --opacity) for its key visual attributes so the user can adjust them interactively. Return ONLY the raw SVG markup, no explanation, no markdown fences.`,
          },
          {
            role: 'user',
            content: `${summaryContext}Create an SVG that expresses the brand trait "${trait}" at intensity ${level}/5 (0=not at all, 5=maximally).`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`OpenRouter ${res.status}: ${text}`)
    }

    const data = await res.json()
    let svg = data.choices?.[0]?.message?.content?.trim()
    if (!svg) throw new Error('No content in response')

    // Strip markdown fences if model added them
    svg = svg.replace(/^```(?:svg|xml)?\s*/i, '').replace(/```\s*$/, '').trim()

    if (!svg.startsWith('<svg')) throw new Error('Response is not valid SVG')

    await saveTextAsset(assetId, sessionId, svg)
    return { success: true, assetId, svg }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generateSVG]', err)
    if (assetId) await markAssetError(assetId, message)
    return { success: false, error: message }
  }
}
