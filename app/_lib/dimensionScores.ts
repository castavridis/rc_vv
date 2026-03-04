import { BRAND_PERSONALITY, DIMENSIONS, type Dimension, type Trait } from './brand'

export type DimensionScores = Record<Dimension, number>

/** Aggregate trait scores → one score per dimension (avg of constituent traits) */
export function computeDimensionScores(
  traitRows: { trait: string; score: number }[]
): DimensionScores {
  const scoreMap = Object.fromEntries(traitRows.map(r => [r.trait, r.score])) as Record<Trait, number>

  return Object.fromEntries(
    DIMENSIONS.map(dimension => {
      const traits = Object.values(BRAND_PERSONALITY[dimension]).flat() as Trait[]
      const scores = traits.map(t => scoreMap[t] ?? 0)
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length
      return [dimension, Math.round(avg * 10) / 10]
    })
  ) as DimensionScores
}
