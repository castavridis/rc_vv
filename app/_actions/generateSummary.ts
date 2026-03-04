'use server'

import supabase from './supabase'
import { createAssetRecord, saveTextAsset, markAssetError } from './saveAssetToStorage'
import { type DimensionScores } from '../_lib/dimensionScores'
import { DIMENSIONS } from '../_lib/brand'

const MODEL = 'mistralai/mistral-small-creative'

export interface GenerateSummaryResult {
  success: boolean
  assetId?: string
  summary?: string
  error?: string
}

export async function generateSummary(
  sessionId: string,
  dimensionWeights: DimensionScores
): Promise<GenerateSummaryResult> {
  let assetId: string | undefined

  try {
    // Fetch trait scores for the session
    const { data: traits } = await supabase
      .from('trait_profiles')
      .select('trait, score')
      .eq('session_id', sessionId)
      .order('score', { ascending: false })

    const topTraits = (traits ?? []).slice(0, 10)
    const traitList = topTraits.map(t => `${t.trait} (${t.score}/5)`).join(', ')
    const dimList = DIMENSIONS.map(d => `${d}: ${dimensionWeights[d]}/5`).join(', ')

    assetId = await createAssetRecord(sessionId, 'summary', null, dimensionWeights)

    await supabase
      .from('generated_assets')
      .update({ status: 'generating' })
      .eq('id', assetId)

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
            content: `You are a brand personality writer. Write a concise 2–3 sentence brand personality summary based on the provided Aaker brand trait scores. Be evocative and specific. Do not list the traits — synthesize them into a coherent brand voice statement.`,
          },
          {
            role: 'user',
            content: `Dimension scores: ${dimList}\n\nTop traits: ${traitList}\n\nWrite the brand personality summary.`,
          },
        ],
      }),
    })

    if (!res.ok) {
      const text = await res.text()
      throw new Error(`OpenRouter ${res.status}: ${text}`)
    }

    const data = await res.json()
    const summary = data.choices?.[0]?.message?.content?.trim()
    if (!summary) throw new Error('No content in response')

    await saveTextAsset(assetId, sessionId, summary)
    return { success: true, assetId, summary }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[generateSummary]', err)
    if (assetId) await markAssetError(assetId, message)
    return { success: false, error: message }
  }
}
