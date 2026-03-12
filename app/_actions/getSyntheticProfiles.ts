'use server'

import supabase from './supabase'
import { aggregateRatings, type TraitScoreMap } from '../_lib/taste-profile'
import { VISION_MODELS } from '../_lib/visionModels'
import { ASSESSMENT_PERSONAS } from '../_lib/assessmentPersonas'

export interface SyntheticRaterProfile {
  model: string
  modelLabel: string
  persona: string
  personaLabel: string
  profile: TraitScoreMap
  artworksRated: number
}

export async function getSyntheticRaterProfiles(
  artworkIds: string[]
): Promise<SyntheticRaterProfile[]> {
  if (artworkIds.length === 0) return []

  const { data, error } = await supabase
    .from('synthetic_ratings')
    .select('trait, score, artwork_id, model, persona')
    .in('artwork_id', artworkIds)

  if (error || !data || data.length === 0) return []

  // Group by (model, persona)
  const groups = new Map<string, typeof data>()
  for (const row of data) {
    const key = `${row.model}::${row.persona}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(row)
  }

  const profiles: SyntheticRaterProfile[] = []
  for (const [key, rows] of groups) {
    const [model, persona] = key.split('::')
    const modelLabel = VISION_MODELS.find(m => m.id === model)?.label ?? model
    const personaLabel = ASSESSMENT_PERSONAS.find(p => p.id === persona)?.label ?? persona

    const profile = aggregateRatings(rows)
    const artworksRated = new Set(rows.map(r => r.artwork_id)).size

    profiles.push({ model, modelLabel, persona, personaLabel, profile, artworksRated })
  }

  return profiles
}
