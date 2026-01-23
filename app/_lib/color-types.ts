// Color Brand Personality Types
// Based on Aaker's Brand Personality Framework

// ============================================================================
// Brand Personality Hierarchy Types
// ============================================================================

export const DIMENSIONS = [
  "Sincerity",
  "Excitement",
  "Competence",
  "Sophistication",
  "Ruggedness",
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

export const FACETS = [
  "Down-to-Earth",
  "Honest",
  "Wholesome",
  "Cheerful",
  "Daring",
  "Spirited",
  "Imaginative",
  "Up-to-Date",
  "Reliable",
  "Intelligent",
  "Successful",
  "Upper Class",
  "Charming",
  "Outdoorsy",
  "Tough",
] as const;

export type Facet = (typeof FACETS)[number];

export const TRAITS = [
  "Down-to-Earth",
  "Family Oriented",
  "Small-Town",
  "Honest",
  "Sincere",
  "Real",
  "Wholesome",
  "Original",
  "Cheerful",
  "Sentimental",
  "Friendly",
  "Daring",
  "Trendy",
  "Exciting",
  "Spirited",
  "Cool",
  "Young",
  "Imaginative",
  "Unique",
  "Up-to-Date",
  "Independent",
  "Contemporary",
  "Reliable",
  "Hard Working",
  "Secure",
  "Intelligent",
  "Technical",
  "Corporate",
  "Successful",
  "Leader",
  "Confident",
  "Upper Class",
  "Glamorous",
  "Good Looking",
  "Charming",
  "Feminine",
  "Smooth",
  "Outdoorsy",
  "Masculine",
  "Western",
  "Tough",
  "Rugged",
] as const;

export type Trait = (typeof TRAITS)[number];

// ============================================================================
// Color Data Types
// ============================================================================

export type AttributeCategory = "symbolizes" | "effects" | "positiveTraits" | "negativeTraits";

export interface ColorAttributeMapping {
  /** The original word from the color meaning */
  word: string;
  /** The mapped brand personality trait */
  trait: Trait;
  /** Confidence score from 0 to 1 */
  confidence: number;
}

export interface ColorAttributes {
  symbolizes: ColorAttributeMapping[];
  effects: ColorAttributeMapping[];
  positiveTraits: ColorAttributeMapping[];
  negativeTraits: ColorAttributeMapping[];
}

export interface ScoreEntry {
  name: string;
  score: number;
  occurrences: number;
}

export interface TraitScoreEntry extends ScoreEntry {
  name: Trait;
}

export interface FacetScoreEntry extends ScoreEntry {
  name: Facet;
}

export interface DimensionScoreEntry extends ScoreEntry {
  name: Dimension;
}

export interface ColorData {
  /** Unique identifier (kebab-case) */
  id: string;
  /** Display name */
  name: string;
  /** Hex color code */
  hex: string;
  /** Source link for color meaning */
  link: string;
  /** Raw attribute mappings */
  attributes: ColorAttributes;
  /** Aggregated trait scores, sorted by score descending */
  traitSummary: TraitScoreEntry[];
  /** Rolled-up facet scores, sorted by score descending */
  facetSummary: FacetScoreEntry[];
  /** Rolled-up dimension scores, sorted by score descending */
  dimensionSummary: DimensionScoreEntry[];
}

// ============================================================================
// Trait Index Types (for reverse lookups)
// ============================================================================

export interface ColorTraitEntry {
  colorId: string;
  colorName: string;
  hex: string;
  score: number;
  occurrences: number;
}

export interface TraitIndex {
  [trait: string]: ColorTraitEntry[];
}

export interface FacetIndex {
  [facet: string]: ColorTraitEntry[];
}

export interface DimensionIndex {
  [dimension: string]: ColorTraitEntry[];
}

// ============================================================================
// Brand Personality Hierarchy
// ============================================================================

export const BRAND_PERSONALITY: Record<Dimension, Partial<Record<Facet, readonly Trait[]>>> = {
  Sincerity: {
    "Down-to-Earth": ["Down-to-Earth", "Family Oriented", "Small-Town"],
    Honest: ["Honest", "Sincere", "Real"],
    Wholesome: ["Wholesome", "Original"],
    Cheerful: ["Cheerful", "Sentimental", "Friendly"],
  },
  Excitement: {
    Daring: ["Daring", "Trendy", "Exciting"],
    Spirited: ["Spirited", "Cool", "Young"],
    Imaginative: ["Imaginative", "Unique"],
    "Up-to-Date": ["Up-to-Date", "Independent", "Contemporary"],
  },
  Competence: {
    Reliable: ["Reliable", "Hard Working", "Secure"],
    Intelligent: ["Intelligent", "Technical", "Corporate"],
    Successful: ["Successful", "Leader", "Confident"],
  },
  Sophistication: {
    "Upper Class": ["Upper Class", "Glamorous", "Good Looking"],
    Charming: ["Charming", "Feminine", "Smooth"],
  },
  Ruggedness: {
    Outdoorsy: ["Outdoorsy", "Masculine", "Western"],
    Tough: ["Tough", "Rugged"],
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

/** Get all facets for a given dimension */
export function getFacetsForDimension(dimension: Dimension): Facet[] {
  return Object.keys(BRAND_PERSONALITY[dimension]) as Facet[];
}

/** Get all traits for a given facet within a dimension */
export function getTraitsForFacet(dimension: Dimension, facet: Facet): Trait[] {
  return [...(BRAND_PERSONALITY[dimension][facet] ?? [])];
}

/** Get the facet and dimension for a given trait */
export function getHierarchyForTrait(trait: Trait): { facet: Facet; dimension: Dimension } | null {
  for (const [dimension, facets] of Object.entries(BRAND_PERSONALITY)) {
    for (const [facet, traits] of Object.entries(facets)) {
      if ((traits as readonly string[]).includes(trait)) {
        return { facet: facet as Facet, dimension: dimension as Dimension };
      }
    }
  }
  return null;
}

/** Get all traits as a flat array */
export function getAllTraits(): Trait[] {
  return [...TRAITS];
}

/** Get all facets as a flat array */
export function getAllFacets(): Facet[] {
  return [...FACETS];
}

/** Get all dimensions as a flat array */
export function getAllDimensions(): Dimension[] {
  return [...DIMENSIONS];
}
