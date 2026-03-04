'use server'

import supabase from './supabase'

export async function updateSessionTitle(sessionId: string, title: string): Promise<void> {
  await supabase
    .from('sessions')
    .update({ title: title.trim(), updated_at: new Date().toISOString() })
    .eq('id', sessionId)
}
