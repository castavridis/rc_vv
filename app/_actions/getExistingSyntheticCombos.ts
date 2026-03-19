'use server'

import supabase from './supabase'
import { getUser } from '../_lib/auth/session'

export interface GetExistingSyntheticCombosResult {
  success: boolean
  combos: string[]
  error?: string
}

export async function getExistingSyntheticCombos(
  artworkIds: string[],
  models: string[],
  personas: string[]
): Promise<GetExistingSyntheticCombosResult> {
  if (artworkIds.length === 0 || models.length === 0 || personas.length === 0) {
    return { success: true, combos: [] }
  }

  const user = await getUser()
  if (!user) return { success: false, combos: [], error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('synthetic_ratings')
    .select('artwork_id, model, persona')
    .in('artwork_id', artworkIds)
    .in('model', models)
    .in('persona', personas)
    .eq('user_id', Number(user.id))

  if (error) {
    return { success: false, combos: [], error: error.message }
  }

  const seen = new Set<string>()
  const combos: string[] = []
  for (const row of data ?? []) {
    const key = `${row.artwork_id}::${row.model}::${row.persona}`
    if (!seen.has(key)) {
      seen.add(key)
      combos.push(key)
    }
  }

  return { success: true, combos }
}
