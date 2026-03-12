import { DIMENSIONS, type Dimension } from './brand'

export type DimensionVector = Record<Dimension, number>

/** Cosine similarity between two 5-dimension score vectors (0–1) */
export function dimensionCosineSimilarity(a: DimensionVector, b: DimensionVector): number {
  let dot = 0, magA = 0, magB = 0
  for (const d of DIMENSIONS) {
    const va = a[d] ?? 0
    const vb = b[d] ?? 0
    dot += va * vb
    magA += va * va
    magB += vb * vb
  }
  magA = Math.sqrt(magA)
  magB = Math.sqrt(magB)
  if (magA === 0 || magB === 0) return 0
  return dot / (magA * magB)
}
