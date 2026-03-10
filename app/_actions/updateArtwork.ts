'use server'

import supabase from './supabase'

export interface UpdateArtworkFields {
  title?: string
  artist?: string | null
  year?: number | null
  description?: string | null
  medium?: string | null
  source_url?: string | null
  tags?: string[]
}

export interface UpdateArtworkResult {
  success: boolean
  error?: string
}

export async function updateArtwork(
  artworkId: string,
  userId: string,
  fields: UpdateArtworkFields
): Promise<UpdateArtworkResult> {
  const { error } = await supabase
    .from('artworks')
    .update(fields)
    .eq('id', artworkId)
    .eq('user_id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
