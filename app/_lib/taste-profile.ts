import { TRAITS, type Trait } from './brand'

export type TraitScoreMap = Partial<Record<Trait, number>>

/** Aggregate raw rating rows into avg score per trait */
export function aggregateRatings(
  rows: { trait: string; score: number }[]
): TraitScoreMap {
  const sums: Record<string, number> = {}
  const counts: Record<string, number> = {}

  for (const row of rows) {
    sums[row.trait] = (sums[row.trait] ?? 0) + row.score
    counts[row.trait] = (counts[row.trait] ?? 0) + 1
  }

  const result: TraitScoreMap = {}
  for (const trait of TRAITS) {
    if (counts[trait]) {
      result[trait] = sums[trait] / counts[trait]
    }
  }
  return result
}

/** Return top N traits by score, descending */
export function topTraits(
  profile: TraitScoreMap,
  n = 5
): { trait: Trait; score: number }[] {
  return (Object.entries(profile) as [Trait, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([trait, score]) => ({ trait, score }))
}
