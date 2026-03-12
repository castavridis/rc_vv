'use server'

import supabase from './supabase'

export interface SaveSyntheticRatingsResult {
  success: boolean
  error?: string
}

export async function saveSyntheticRatings(
  userId: string,
  artworkId: string,
  model: string,
  persona: string,
  ratings: Record<string, { score: number; reason: string }>
): Promise<SaveSyntheticRatingsResult> {
  const isDimension = (key: string) =>
    ['Sincerity', 'Excitement', 'Competence', 'Sophistication', 'Ruggedness'].includes(key)

  const rows = Object.entries(ratings)
    .filter(([, rating]) => rating !== undefined && rating.score !== 0)
    .map(([trait, rating]) => {
      const rawScore = rating.score
      // Dimensions keep 0-5 scale; traits are binary (0 or 1)
      const score = isDimension(trait) ? rawScore : (rawScore >= 0.5 ? 1 : 0)
      return {
        user_id: Number(userId),
        artwork_id: artworkId,
        trait,
        score,
        reason: rating.reason ?? '',
        model,
        persona,
      }
    })

  if (rows.length === 0) {
    return { success: true }
  }

  const { error } = await supabase
    .from('synthetic_ratings')
    .upsert(rows, { onConflict: 'artwork_id,trait,model,persona' })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
