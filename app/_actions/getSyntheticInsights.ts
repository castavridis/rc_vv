'use server'

import { getUser } from '../_lib/auth/session'
import supabase from './supabase'

export interface InsightRow {
  trait: string
  score: number
  reason: string
  model: string
  persona: string
  artworkId: string
  artworkTitle: string
}

export async function getSyntheticInsights(): Promise<{ rows: InsightRow[]; error?: string }> {
  const user = await getUser()
  if (!user) return { rows: [], error: 'Unauthorized' }

  const { data, error } = await supabase
    .from('synthetic_ratings')
    .select('trait, score, reason, model, persona, artwork_id')
    .eq('user_id', Number(user.id))

  if (error) return { rows: [], error: error.message }
  if (!data?.length) return { rows: [] }

  // Fetch artwork titles for the artwork IDs present in the results
  const artworkIds = Array.from(new Set(data.map(r => r.artwork_id)))
  const { data: artworks } = await supabase
    .from('artworks')
    .select('id, title')
    .in('id', artworkIds)

  const titleMap: Record<string, string> = {}
  for (const a of artworks ?? []) {
    titleMap[a.id] = a.title ?? a.id
  }

  const rows: InsightRow[] = data.map(r => ({
    trait: r.trait,
    score: r.score,
    reason: r.reason ?? '',
    model: r.model,
    persona: r.persona,
    artworkId: r.artwork_id,
    artworkTitle: titleMap[r.artwork_id] ?? r.artwork_id,
  }))

  return { rows }
}
