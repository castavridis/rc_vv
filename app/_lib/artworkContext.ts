import { getAllUserRatings } from '../_actions/saveArtworkRatings'
import supabase from '../_actions/supabase'
import { aggregateRatings, type TraitScoreMap } from './taste-profile'
import { rankBySimilarity, rankByOpposition } from './artwork-similarity'
import { type Trait } from './brand'

export interface ArtworkContextItem {
  id: string
  title: string
  artist?: string | null
  ratings: TraitScoreMap
  direction: 'same' | 'opposing'
}

export async function getArtworkContextForUser(userId: string): Promise<ArtworkContextItem[]> {
  const allRatings = await getAllUserRatings(userId)
  if (allRatings.length === 0) return []

  // Build per-artwork profile maps
  const byArtwork: Record<string, TraitScoreMap> = {}
  for (const r of allRatings) {
    byArtwork[r.artwork_id] ??= {}
    ;(byArtwork[r.artwork_id] as Record<string, number>)[r.trait] = r.score
  }

  const artworkList = Object.entries(byArtwork).map(([artworkId, profile]) => ({
    artworkId,
    profile,
  }))

  // User's overall taste profile as the reference
  const tasteProfile = aggregateRatings(allRatings)

  const similar = rankBySimilarity(tasteProfile, artworkList).slice(0, 3)
  const opposing = rankByOpposition(tasteProfile, artworkList).slice(0, 2)

  // Fetch artwork metadata for selected IDs
  const selectedIds = [
    ...similar.map(a => a.artworkId),
    ...opposing.map(a => a.artworkId),
  ]

  const { data: artworks } = await supabase
    .from('artworks')
    .select('id, title, artist')
    .in('id', selectedIds)

  const artworkMeta = new Map(
    (artworks ?? []).map(a => [a.id, { title: a.title, artist: a.artist }])
  )

  const result: ArtworkContextItem[] = []

  for (const a of similar) {
    const meta = artworkMeta.get(a.artworkId)
    if (!meta) continue
    result.push({ id: a.artworkId, ...meta, ratings: byArtwork[a.artworkId], direction: 'same' })
  }

  for (const a of opposing) {
    const meta = artworkMeta.get(a.artworkId)
    if (!meta) continue
    result.push({ id: a.artworkId, ...meta, ratings: byArtwork[a.artworkId], direction: 'opposing' })
  }

  return result
}
