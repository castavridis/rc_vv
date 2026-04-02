'use server'

import { getUser } from '../_lib/auth/session'
import { getArtworkContextForUser } from '../_lib/artworkContext'
import { getArtworkRatings } from './saveArtworkRatings'
import { DIMENSIONS } from '../_lib/brand'
import supabase from './supabase'

export interface ArtworkRating {
  trait: string
  score: number
  reason: string
}

export interface UserArtwork {
  id: string
  title: string
  artist: string | null
  image_url: string | null
}

export async function getUserArtworks(): Promise<UserArtwork[]> {
  const user = await getUser()
  if (!user) return []

  const { data } = await supabase
    .from('artworks')
    .select('id, title, artist, image_url')
    .eq('user_id', Number(user.id))
    .order('created_at', { ascending: false })

  return (data ?? []).map(a => ({
    id: a.id,
    title: a.title ?? a.id,
    artist: a.artist ?? null,
    image_url: a.image_url ?? null,
  }))
}

/**
 * Fetch all user artwork_ratings grouped by artwork ID.
 * Returns { artworkId → ArtworkRating[] }
 */
export async function getAllArtworkRatings(): Promise<Record<string, ArtworkRating[]>> {
  const user = await getUser()
  if (!user) return {}

  const { data, error } = await supabase
    .from('artwork_ratings')
    .select('artwork_id, trait, score, reason')
    .eq('user_id', Number(user.id))

  if (error || !data) return {}

  const byArtwork: Record<string, ArtworkRating[]> = {}
  for (const r of data) {
    byArtwork[r.artwork_id] ??= []
    byArtwork[r.artwork_id].push({
      trait: r.trait,
      score: Number(r.score),
      reason: r.reason ?? '',
    })
  }
  return byArtwork
}

/**
 * Enhanced artwork context string that includes reasons for each trait rating.
 * Used by Prompt Lab to give models richer few-shot examples.
 */
export async function getArtworkContextStringWithReasons(): Promise<string> {
  const user = await getUser()
  if (!user) return ''

  const items = await getArtworkContextForUser(String(user.id))
  if (items.length === 0) return ''

  // Fetch full ratings (with reasons) for each reference artwork
  const ratingsById: Record<string, Record<string, { score: number; reason: string }>> = {}
  await Promise.all(
    items.map(async (item) => {
      ratingsById[item.id] = await getArtworkRatings(String(user.id), item.id)
    })
  )

  const lines = ['\n\nREFERENCE ARTWORKS (from the user\'s rated library):']
  for (const item of items) {
    const label = item.direction === 'same'
      ? 'Same-direction reference (aligns with user\'s taste)'
      : 'Opposing reference (contrasts with user\'s taste)'
    lines.push(`\n[${label}]`)
    lines.push(`Artwork: "${item.title}"${item.artist ? ` by ${item.artist}` : ''}`)

    const fullRatings = ratingsById[item.id] ?? {}
    const dimSet = new Set<string>(DIMENSIONS)

    // Dimension ratings (0-5 scale)
    const dims = (Object.entries(fullRatings) as [string, { score: number; reason: string }][])
      .filter(([key]) => dimSet.has(key))
      .sort((a, b) => b[1].score - a[1].score)
    if (dims.length > 0) {
      lines.push('Dimension scores (0-5):')
      for (const [dim, r] of dims) {
        lines.push(`  ${dim} = ${r.score}${r.reason ? ` — ${r.reason}` : ''}`)
      }
    }

    // Trait ratings (binary)
    const traits = (Object.entries(fullRatings) as [string, { score: number; reason: string }][])
      .filter(([key]) => !dimSet.has(key))
    const present = traits.filter(([, r]) => r.score >= 1).sort((a, b) => b[1].score - a[1].score)
    const absent = traits.filter(([, r]) => r.score === 0)

    if (present.length > 0) {
      lines.push('Traits present:')
      for (const [trait, r] of present) {
        lines.push(`  ${trait} = ${r.score}${r.reason ? ` — ${r.reason}` : ''}`)
      }
    }
    if (absent.length > 0) {
      lines.push('Traits absent:')
      for (const [trait, r] of absent) {
        lines.push(`  ${trait} = 0${r.reason ? ` — ${r.reason}` : ''}`)
      }
    }
  }
  return lines.join('\n')
}
