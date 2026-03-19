'use server'

import supabase from './supabase'
import { getUser } from '../_lib/auth/session'

export async function savePromptConfig(
  model: string,
  persona: string,
  promptText: string
): Promise<{ success: boolean; error?: string }> {
  const user = await getUser()
  if (!user) return { success: false, error: 'Not authenticated' }

  // Deactivate existing active config for this combo
  await supabase
    .from('prompt_configs')
    .update({ is_active: false })
    .eq('user_id', Number(user.id))
    .eq('model', model)
    .eq('persona', persona)
    .eq('is_active', true)

  // Insert new active config
  const { error } = await supabase
    .from('prompt_configs')
    .insert({
      user_id: Number(user.id),
      model,
      persona,
      prompt_text: promptText,
      is_active: true,
    })

  if (error) return { success: false, error: error.message }
  return { success: true }
}
