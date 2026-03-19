'use server'

import supabase from './supabase'
import { getUser } from '../_lib/auth/session'

export interface AssessmentErrorRow {
  id: string
  artworkId: string
  artworkTitle: string | null
  artworkImageUrl: string | null
  model: string
  persona: string
  rawResponse: string
  error: string
  createdAt: string
}

export async function getAssessmentErrors(): Promise<{ success: boolean; rows: AssessmentErrorRow[] }> {
  const user = await getUser()
  if (!user) return { success: false, rows: [] }

  const { data, error } = await supabase
    .from('synthetic_rating_errors')
    .select('*, artworks(title, image_url)')
    .eq('user_id', Number(user.id))
    .is('resolved_at', null)
    .order('created_at', { ascending: false })

  if (error) return { success: false, rows: [] }

  const rows: AssessmentErrorRow[] = (data ?? []).map((row: {
    id: string
    artwork_id: string
    model: string
    persona: string
    raw_response: string
    error: string
    created_at: string
    artworks: { title: string | null; image_url: string | null } | null
  }) => ({
    id: row.id,
    artworkId: row.artwork_id,
    artworkTitle: row.artworks?.title ?? null,
    artworkImageUrl: row.artworks?.image_url ?? null,
    model: row.model,
    persona: row.persona,
    rawResponse: row.raw_response,
    error: row.error,
    createdAt: row.created_at,
  }))

  return { success: true, rows }
}
