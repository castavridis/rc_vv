import {
  DIMENSIONS,
  FACETS,
  TRAITS,
  BRAND_PERSONALITY,
  type Dimension,
  type Facet,
  type Trait,
} from './brand'

export type SubjectType = 'dimension' | 'facet' | 'trait'

export interface Subject {
  name: string
  type: SubjectType
  dimension: Dimension
  facet?: Facet
}

export interface FacetGroup {
  facet: Facet
  facetSubject: Subject | null // null if deduped into trait
  traits: Subject[]
}

export interface DimensionGroup {
  dimension: Dimension
  dimensionSubject: Subject
  facets: FacetGroup[]
}

/** All unique subject names, deduped across dimensions/facets/traits */
export function getUniqueSubjects(): Subject[] {
  const seen = new Set<string>()
  const subjects: Subject[] = []

  for (const dimension of DIMENSIONS) {
    if (!seen.has(dimension)) {
      seen.add(dimension)
      subjects.push({ name: dimension, type: 'dimension', dimension })
    }

    const facets = Object.keys(BRAND_PERSONALITY[dimension]) as Facet[]
    for (const facet of facets) {
      if (!seen.has(facet)) {
        seen.add(facet)
        subjects.push({ name: facet, type: 'facet', dimension, facet })
      }

      const traits = BRAND_PERSONALITY[dimension][facet] ?? []
      for (const trait of traits) {
        if (!seen.has(trait)) {
          seen.add(trait)
          subjects.push({ name: trait, type: 'trait', dimension, facet })
        }
      }
    }
  }

  return subjects
}

/** Grouped hierarchy for UI display */
export function getGroupedSubjects(): DimensionGroup[] {
  const allSubjects = getUniqueSubjects()
  const subjectByName = new Map(allSubjects.map(s => [s.name, s]))

  return DIMENSIONS.map(dimension => {
    const facets = Object.keys(BRAND_PERSONALITY[dimension]) as Facet[]

    return {
      dimension,
      dimensionSubject: subjectByName.get(dimension)!,
      facets: facets.map(facet => {
        const traits = BRAND_PERSONALITY[dimension][facet] ?? []
        // Facet subject is only present if the facet name wasn't already used as a trait
        const facetSubject = subjectByName.get(facet) ?? null

        return {
          facet,
          facetSubject,
          traits: traits
            .map(t => subjectByName.get(t))
            .filter((s): s is Subject => s != null),
        }
      }),
    }
  })
}

/** Slug a subject name for filesystem use */
export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}
