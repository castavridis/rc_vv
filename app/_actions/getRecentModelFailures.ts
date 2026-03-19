'use server'

import supabase from './supabase'
import { getUser } from '../_lib/auth/session'

export async function getRecentModelFailures(): Promise<{ success: boolean; counts: Record<string, number> }> {
  const user = await getUser()
  if (!user) return { success: false, counts: {} }

  const { data, error } = await supabase
    .from('synthetic_rating_errors')
    .select('model')
    .eq('user_id', Number(user.id))
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .is('resolved_at', null)

  if (error) return { success: false, counts: {} }

  const counts: Record<string, number> = {}
  for (const row of data ?? []) {
    counts[row.model] = (counts[row.model] ?? 0) + 1
  }
  return { success: true, counts }
}
