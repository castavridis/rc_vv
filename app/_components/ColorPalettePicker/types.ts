import type { Dimension, Facet, Trait, ColorTraitEntry, TraitScoreEntry, FacetScoreEntry } from "@/app/_lib/color-types";

export interface EnrichedColorEntry extends ColorTraitEntry {
  relevantTraits?: TraitScoreEntry[];
  relevantFacets?: FacetScoreEntry[];
}

export interface ColorPalettePickerProps {
  /** Initial dimension to display */
  initialDimension?: Dimension;
  /** Initial facet (requires initialDimension) */
  initialFacet?: Facet;
  /** Initial trait (requires initialDimension and initialFacet) */
  initialTrait?: Trait;
  /** Maximum colors to show initially (default: 12) */
  initialColorLimit?: number;
  /** Callback when a color is selected */
  onColorSelect?: (color: ColorTraitEntry) => void;
  /** Custom className for the container */
  className?: string;
}

export interface HierarchyNavProps {
  dimensions: readonly Dimension[];
  selectedDimension: Dimension | null;
  facets: Facet[];
  selectedFacet: Facet | null;
  traits: Trait[];
  selectedTrait: Trait | null;
  onDimensionSelect: (dimension: Dimension) => void;
  onFacetSelect: (facet: Facet) => void;
  onTraitSelect: (trait: Trait) => void;
}

export interface ColorGridProps {
  colors: ColorTraitEntry[];
  totalCount: number;
  showingAll: boolean;
  onShowAll: () => void;
  onColorClick: (color: ColorTraitEntry) => void;
  selectedDimension: Dimension | null;
  selectedFacet: Facet | null;
}

export interface ColorSwatchProps {
  color: EnrichedColorEntry;
  maxScore: number;
  onClick: () => void;
  showTraitsFacets?: boolean;
}

export interface BreadcrumbNavProps {
  dimension: Dimension | null;
  facet: Facet | null;
  trait: Trait | null;
  onNavigateToRoot: () => void;
  onNavigateToDimension: () => void;
  onNavigateToFacet: () => void;
}
