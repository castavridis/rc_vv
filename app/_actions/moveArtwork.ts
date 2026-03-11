'use server'

import supabase from './supabase'

export async function moveArtwork(
  artworkId: string,
  userId: string,
  libraryId: string | null
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('artworks')
    .update({ library_id: libraryId })
    .eq('id', artworkId)
    .eq('user_id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
