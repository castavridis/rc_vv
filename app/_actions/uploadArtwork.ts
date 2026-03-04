'use server'

import supabase from './supabase'

export interface UploadArtworkResult {
  success: boolean
  artworkId?: string
  error?: string
}

export async function uploadArtwork(formData: FormData): Promise<UploadArtworkResult> {
  const file = formData.get('image') as File | null
  const title = formData.get('title') as string
  const artist = (formData.get('artist') as string) || null
  const yearRaw = formData.get('year') as string
  const year = yearRaw ? parseInt(yearRaw, 10) : null

  if (!file || !title) {
    return { success: false, error: 'Image and title are required' }
  }

  const ext = file.name.split('.').pop() ?? 'jpg'
  const filename = `${crypto.randomUUID()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('artworks')
    .upload(filename, file, { contentType: file.type })

  if (uploadError) {
    return { success: false, error: uploadError.message }
  }

  const { data: { publicUrl } } = supabase.storage
    .from('artworks')
    .getPublicUrl(filename)

  const { data, error: dbError } = await supabase
    .from('artworks')
    .insert({ title, artist, year, image_url: publicUrl, source: 'upload' })
    .select('id')
    .single()

  if (dbError) {
    return { success: false, error: dbError.message }
  }

  return { success: true, artworkId: data.id }
}
