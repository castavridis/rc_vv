'use server'

import { createAssetRecord, saveTextAsset, markAssetError } from './saveAssetToStorage'
import { type DimensionScores } from '../_lib/dimensionScores'
import { type Trait } from '../_lib/brand'
import { levelForTrait } from '../_lib/bflPrompt'

const MODEL = 'anthropic/claude-sonnet-4-6'

export interface GenerateAnimationResult {
  success: boolean
  assetId?: string
  code?: string
  error?: string
}

export async function generateAnimation(
  sessionId: string,
  trait: Trait,
  dimensionWeights: DimensionScores,
  brandSummary?: string
): Promise<GenerateAnimationResult> {
  let assetId: string | undefined

  try {
    const level = levelForTrait(trait, dimensionWeights)
    const summaryContext = brandSummary ? `Brand context: ${brandSummary}\n\n` : ''

    assetId = await createAssetRecord(sessionId, 'animation', trait, dimensionWeights)

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
            content: `You are a GSAP animation designer. Write a GSAP animation that can be applied to an SVG element (referenced as \`el\`). The animation should express a brand personality trait. Use gsap.to(), gsap.from(), or gsap.timeline(). Expose duration, ease, and scale as variables at the top so they can be adjusted. GSAP is already available globally. Return ONLY the JavaScript code, no explanation, no markdown fences.`,
          },
          {
            role: 'user',
            content: `${summaryContext}Write a GSAP animation for trait "${trait}" at intensity ${level}/5 (0=not at all, 5=maximally). The animation should run on an element referenced as \`el\`.`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`OpenRouter ${res.status}: ${text}`)
    }

    const data = await res.json()
    let code = data.choices?.[0]?.message?.content?.trim()
    if (!code) throw new Error('No content in response')

    // Strip markdown fences if model added them
    code = code.replace(/^```(?:javascript|js)?\s*/i, '').replace(/```\s*$/, '').trim()

    await saveTextAsset(assetId, sessionId, code)
    return { success: true, assetId, code }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generateAnimation]', err)
    if (assetId) await markAssetError(assetId, message)
    return { success: false, error: message }
  }
}
