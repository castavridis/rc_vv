'use server'

import supabase from './supabase'
import { type Trait } from '../_lib/brand'

export interface SaveRatingsResult {
  success: boolean
  error?: string
}

export async function saveArtworkRatings(
  userId: string,
  artworkId: string,
  ratings: Partial<Record<Trait, { score: number; reason: string }>>
): Promise<SaveRatingsResult> {
  const rows = Object.entries(ratings)
    .filter(([, rating]) => rating !== undefined)
    .map(([trait, rating]) => ({
      user_id: Number(userId),
      artwork_id: artworkId,
      trait,
      score: (rating as { score: number; reason: string }).score,
      reason: (rating as { score: number; reason: string }).reason ?? '',
    }))

  if (rows.length === 0) {
    return { success: true }
  }

  const { error } = await supabase
    .from('artwork_ratings')
    .upsert(rows, { onConflict: 'user_id,artwork_id,trait' })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/** Fetch all ratings for a given artwork + user */
export async function getArtworkRatings(
  userId: string,
  artworkId: string
): Promise<Partial<Record<Trait, { score: number; reason: string }>>> {
  const { data, error } = await supabase
    .from('artwork_ratings')
    .select('trait, score, reason')
    .eq('user_id', Number(userId))
    .eq('artwork_id', artworkId)

  if (error || !data) return {}

  return Object.fromEntries(data.map(r => [r.trait, { score: Number(r.score), reason: r.reason ?? '' }])) as Partial<Record<Trait, { score: number; reason: string }>>
}

/** Fetch all ratings for a user (for taste profile + similarity) */
export async function getAllUserRatings(
  userId: string
): Promise<{ trait: string; score: number; artwork_id: string }[]> {
  const { data, error } = await supabase
    .from('artwork_ratings')
    .select('trait, score, artwork_id')
    .eq('user_id', Number(userId))

  if (error || !data) return []
  return data
}

/** Get set of artwork IDs the user has rated at least once */
export async function getRatedArtworkIds(userId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('artwork_ratings')
    .select('artwork_id')
    .eq('user_id', Number(userId))

  if (error || !data) return new Set()
  return new Set(data.map(r => r.artwork_id))
}
