'use server'

import supabase from './supabase'
import { getUser } from '../_lib/auth/session'

export interface PromptConfigRow {
  id: string
  model: string
  persona: string
  promptText: string
  isActive: boolean
  createdAt: string
}

export async function getPromptConfigs(): Promise<{ success: boolean; configs: PromptConfigRow[] }> {
  const user = await getUser()
  if (!user) return { success: false, configs: [] }

  const { data, error } = await supabase
    .from('prompt_configs')
    .select('id, model, persona, prompt_text, is_active, created_at')
    .eq('user_id', Number(user.id))
    .order('model', { ascending: true })
    .order('persona', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) return { success: false, configs: [] }

  const configs: PromptConfigRow[] = (data ?? []).map((row: {
    id: string
    model: string
    persona: string
    prompt_text: string
    is_active: boolean
    created_at: string
  }) => ({
    id: row.id,
    model: row.model,
    persona: row.persona,
    promptText: row.prompt_text,
    isActive: row.is_active,
    createdAt: row.created_at,
  }))

  return { success: true, configs }
}
