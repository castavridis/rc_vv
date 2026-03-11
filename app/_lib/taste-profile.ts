import { TRAITS, type Trait } from './brand'

export type TraitScoreMap = Partial<Record<Trait, number>>

/** Aggregate raw rating rows into fraction (0-1) per trait across artworks.
 *  For binary traits: fraction = (count of "applies") / (total artworks rated on that trait) */
export function aggregateRatings(
  rows: { trait: string; score: number }[]
): TraitScoreMap {
  const appliesCount: Record<string, number> = {}
  const totalCount: Record<string, number> = {}

  for (const row of rows) {
    appliesCount[row.trait] = (appliesCount[row.trait] ?? 0) + (row.score >= 0.5 ? 1 : 0)
    totalCount[row.trait] = (totalCount[row.trait] ?? 0) + 1
  }

  const result: TraitScoreMap = {}
  for (const trait of TRAITS) {
    if (totalCount[trait]) {
      result[trait] = appliesCount[trait] / totalCount[trait]
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
