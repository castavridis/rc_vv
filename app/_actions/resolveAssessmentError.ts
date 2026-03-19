'use server'

import supabase from './supabase'
import { getUser } from '../_lib/auth/session'

export async function resolveAssessmentError(id: string): Promise<{ success: boolean; error?: string }> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('synthetic_rating_errors')
    .update({ resolved_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', Number(user.id))

  if (error) return { success: false, error: error.message }
  return { success: true }
}
