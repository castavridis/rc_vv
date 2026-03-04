import { TRAITS, type Trait } from './brand'

export type TraitScores = Record<Trait, number>

/** Average multiple trait score sets into one */
export function averageTraitScores(scoreSets: TraitScores[]): TraitScores {
  if (scoreSets.length === 0) {
    return Object.fromEntries(TRAITS.map(t => [t, 0])) as TraitScores
  }

  const sums = Object.fromEntries(TRAITS.map(t => [t, 0])) as Record<Trait, number>
  for (const scores of scoreSets) {
    for (const trait of TRAITS) {
      sums[trait] += scores[trait] ?? 0
    }
  }

  return Object.fromEntries(
    TRAITS.map(t => [t, sums[t] / scoreSets.length])
  ) as TraitScores
}

/** Parse and validate a JSON string from a model response into trait scores */
export function parseModelResponse(content: string): TraitScores | null {
  // Strip markdown code fences if present
  const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  const jsonStr = fenceMatch ? fenceMatch[1] : content

  try {
    const parsed = JSON.parse(jsonStr.trim())
    const result = Object.fromEntries(
      TRAITS.map(trait => {
        const val = parsed[trait]
        const score = typeof val === 'number'
          ? Math.max(0, Math.min(5, Math.round(val)))
          : 0
        return [trait, score]
      })
    ) as TraitScores
    return result
  } catch {
    return null
  }
}

/** Derive auto-title from top trait scores */
export function autoTitleFromScores(scores: TraitScores, date: Date = new Date()): string {
  const top = (Object.entries(scores) as [Trait, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .filter(([, s]) => s > 0)
    .map(([t]) => t)

  const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const traitStr = top.length > 0 ? top.join(', ') : 'New Session'
  return `${traitStr} · ${dateStr}`
}
