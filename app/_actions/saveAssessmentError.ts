'use server'

import supabase from './supabase'

export async function saveAssessmentError(
  userId: string,
  artworkId: string,
  model: string,
  persona: string,
  rawResponse: string,
  error: string
): Promise<void> {
  const { error: dbError } = await supabase.from('synthetic_rating_errors').insert({
    user_id: Number(userId),
    artwork_id: artworkId,
    model,
    persona,
    raw_response: rawResponse,
    error,
  })
  if (dbError) {
    console.error('[saveAssessmentError] failed to save:', dbError.message)
  }
}
