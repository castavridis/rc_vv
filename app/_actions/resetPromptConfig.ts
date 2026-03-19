'use server'

import supabase from './supabase'
import { getUser } from '../_lib/auth/session'

export async function resetPromptConfig(
  model: string,
  persona: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  const { error } = await supabase
    .from('prompt_configs')
    .update({ is_active: false })
    .eq('user_id', Number(user.id))
    .eq('model', model)
    .eq('persona', persona)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
