'use server'

import supabase from './supabase'

export async function deleteArtwork(artworkId: string, userId: string): Promise<{ success: boolean; error?: string }> {
  // Delete ratings first (foreign key dependency)
  await supabase
    .from('artwork_ratings')
    .delete()
    .eq('artwork_id', artworkId)
    .eq('user_id', Number(userId))

  // Get artwork to find storage file
  const { data: artwork } = await supabase
    .from('artworks')
    .select('image_url')
    .eq('id', artworkId)
    .eq('user_id', userId)
    .single()

  if (!artwork) {
    return { success: false, error: 'Artwork not found' }
  }

  // Delete storage file if it exists in our bucket
  if (artwork.image_url) {
    const match = artwork.image_url.match(/\/artworks\/(.+)$/)
    if (match) {
      await supabase.storage.from('artworks').remove([match[1]])
    }
  }

  // Delete artwork record
  const { error } = await supabase
    .from('artworks')
    .delete()
    .eq('id', artworkId)
    .eq('user_id', userId)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
