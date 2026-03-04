import { type TraitScoreMap } from './taste-profile'

/** Cosine similarity between two trait score maps (0–1) */
export function cosineSimilarity(a: TraitScoreMap, b: TraitScoreMap): number {
  const keys = Object.keys(a) as (keyof TraitScoreMap)[]
  const dot = keys.reduce((sum, k) => sum + (a[k] ?? 0) * (b[k] ?? 0), 0)
  const magA = Math.sqrt(Object.values(a).reduce((sum, v) => sum + v * v, 0))
  const magB = Math.sqrt(Object.values(b).reduce((sum, v) => sum + v * v, 0))
  if (magA === 0 || magB === 0) return 0
  return dot / (magA * magB)
}

/** True if both profiles share at least one trait where both scores > 0 */
export function hasTraitInCommon(a: TraitScoreMap, b: TraitScoreMap): boolean {
  return (Object.keys(a) as (keyof TraitScoreMap)[]).some(
    k => (a[k] ?? 0) > 0 && (b[k] ?? 0) > 0
  )
}

/** Cosine distance (opposition) — higher means more opposing */
export function cosineDistance(a: TraitScoreMap, b: TraitScoreMap): number {
  return 1 - cosineSimilarity(a, b)
}

export interface ScoredArtwork {
  artworkId: string
  profile: TraitScoreMap
  similarityScore: number
}

/** Sort artworks by similarity to a reference profile (most similar first) */
export function rankBySimilarity(
  reference: TraitScoreMap,
  artworks: { artworkId: string; profile: TraitScoreMap }[]
): ScoredArtwork[] {
  return artworks
    .map(a => ({ ...a, similarityScore: cosineSimilarity(reference, a.profile) }))
    .sort((a, b) => b.similarityScore - a.similarityScore)
}

/** Sort artworks by opposition to a reference profile (most opposing first) */
export function rankByOpposition(
  reference: TraitScoreMap,
  artworks: { artworkId: string; profile: TraitScoreMap }[]
): ScoredArtwork[] {
  return artworks
    .map(a => ({ ...a, similarityScore: cosineDistance(reference, a.profile) }))
    .sort((a, b) => b.similarityScore - a.similarityScore)
}
