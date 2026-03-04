'use server'

import supabase from './supabase'

export interface AssetRow {
  id: string
  task: string
  trait: string | null
  storage_url: string | null
  content: string | null
  status: string
  error_message: string | null
  created_at: string
}

export async function getSessionAssets(sessionId: string): Promise<AssetRow[]> {
  const { data } = await supabase
    .from('generated_assets')
    .select('id, task, trait, storage_url, content, status, error_message, created_at')
    .eq('session_id', sessionId)
    .eq('status', 'done')
    .order('created_at', { ascending: false })

  return data ?? []
}
