export const DIMENSIONS = [
  "Sincerity",
  "Excitement",
  "Competence",
  "Sophistication",
  "Ruggedness",
] as const;

export type Dimension = typeof DIMENSIONS[number];

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

export type Facet = typeof FACETS[number];

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

export type Trait = typeof TRAITS[number];

// Full hierarchy mapping
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

// Helper to get facets for a dimension
export function getFacetsForDimension(dimension: Dimension): Facet[] {
  return Object.keys(BRAND_PERSONALITY[dimension]) as Facet[];
}

// Helper to get traits for a facet
export function getTraitsForFacet(dimension: Dimension, facet: Facet): Trait[] {
  return [...(BRAND_PERSONALITY[dimension][facet] ?? [])];
}
