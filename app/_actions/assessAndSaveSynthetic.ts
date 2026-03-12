'use server'

import { getUser } from '../_lib/auth/session'
import { assessArtwork } from './assessArtwork'
import { saveSyntheticRatings } from './saveSyntheticRatings'

export interface AssessAndSaveSyntheticResult {
  success: boolean
  artworkId: string
  error?: string
}

export async function assessAndSaveSynthetic(
  artworkId: string,
  model: string,
  personaId: string
): Promise<AssessAndSaveSyntheticResult> {
  const user = await getUser()
  if (!user) return { success: false, artworkId, error: 'Not authenticated' }

  const result = await assessArtwork(artworkId, model, personaId)
  if (!result.success || !result.scores) {
    return { success: false, artworkId, error: result.error ?? 'Assessment failed' }
  }

  const saveResult = await saveSyntheticRatings(
    String(user.id),
    artworkId,
    model,
    personaId,
    result.scores
  )

  if (!saveResult.success) {
    return { success: false, artworkId, error: saveResult.error ?? 'Failed to save ratings' }
  }

  return { success: true, artworkId }
}
