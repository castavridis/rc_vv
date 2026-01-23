"use client";

import { useState, useMemo } from "react";
import {
  DIMENSIONS,
  getFacetsForDimension,
  getTraitsForFacet,
  type Dimension,
  type Facet,
  type Trait,
  type ColorTraitEntry,
} from "@/app/_lib/color-types";
import {
  getColorsByDimension,
  getColorsByFacet,
  getColorsByTrait,
  TRAIT_INDEX,
  FACET_INDEX,
  DIMENSION_INDEX,
} from "@/app/_lib/trait-index";
import { BreadcrumbNav } from "./BreadcrumbNav";
import { HierarchyNav } from "./HierarchyNav";
import { ColorGrid } from "./ColorGrid";
import { DEFAULT_COLOR_LIMIT } from "./constants";
import type { ColorPalettePickerProps } from "./types";

export function ColorPalettePicker({
  initialDimension,
  initialFacet,
  initialTrait,
  initialColorLimit = DEFAULT_COLOR_LIMIT,
  onColorSelect,
  className = "",
}: ColorPalettePickerProps) {
  // Selection state
  const [selectedDimension, setSelectedDimension] = useState<Dimension | null>(
    initialDimension ?? null
  );
  const [selectedFacet, setSelectedFacet] = useState<Facet | null>(
    initialFacet ?? null
  );
  const [selectedTrait, setSelectedTrait] = useState<Trait | null>(
    initialTrait ?? null
  );

  // View state
  const [showAllColors, setShowAllColors] = useState(false);
  const colorLimit = initialColorLimit;

  // Derived: facets for current dimension
  const facets = useMemo(() => {
    if (!selectedDimension) return [];
    return getFacetsForDimension(selectedDimension);
  }, [selectedDimension]);

  // Derived: traits for current facet
  const traits = useMemo(() => {
    if (!selectedDimension || !selectedFacet) return [];
    return getTraitsForFacet(selectedDimension, selectedFacet);
  }, [selectedDimension, selectedFacet]);

  // Get colors based on current selection
  const { colors, totalCount } = useMemo(() => {
    let allColors: ColorTraitEntry[];
    let total: number;

    if (selectedTrait) {
      allColors = getColorsByTrait(selectedTrait);
      total = TRAIT_INDEX[selectedTrait]?.length ?? 0;
    } else if (selectedFacet) {
      allColors = getColorsByFacet(selectedFacet);
      total = FACET_INDEX[selectedFacet]?.length ?? 0;
    } else if (selectedDimension) {
      allColors = getColorsByDimension(selectedDimension);
      total = DIMENSION_INDEX[selectedDimension]?.length ?? 0;
    } else {
      // No selection - show empty state
      return { colors: [], totalCount: 0 };
    }

    const limitedColors = showAllColors
      ? allColors
      : allColors.slice(0, colorLimit);

    return { colors: limitedColors, totalCount: total };
  }, [selectedDimension, selectedFacet, selectedTrait, showAllColors, colorLimit]);

  // Navigation handlers
  const handleDimensionSelect = (dimension: Dimension) => {
    setSelectedDimension(dimension);
    setSelectedFacet(null);
    setSelectedTrait(null);
    setShowAllColors(false);
  };

  const handleFacetSelect = (facet: Facet) => {
    setSelectedFacet(facet);
    setSelectedTrait(null);
    setShowAllColors(false);
  };

  const handleTraitSelect = (trait: Trait) => {
    setSelectedTrait(trait);
    setShowAllColors(false);
  };

  const handleNavigateToRoot = () => {
    setSelectedDimension(null);
    setSelectedFacet(null);
    setSelectedTrait(null);
    setShowAllColors(false);
  };

  const handleNavigateToDimension = () => {
    setSelectedFacet(null);
    setSelectedTrait(null);
    setShowAllColors(false);
  };

  const handleNavigateToFacet = () => {
    setSelectedTrait(null);
    setShowAllColors(false);
  };

  const handleColorClick = (color: ColorTraitEntry) => {
    onColorSelect?.(color);
  };

  const handleShowAll = () => {
    setShowAllColors(true);
  };

  return (
    <div className={`${className}`}>
      {/* Breadcrumb navigation */}
      <BreadcrumbNav
        dimension={selectedDimension}
        facet={selectedFacet}
        trait={selectedTrait}
        onNavigateToRoot={handleNavigateToRoot}
        onNavigateToDimension={handleNavigateToDimension}
        onNavigateToFacet={handleNavigateToFacet}
      />

      {/* Hierarchy navigation */}
      <HierarchyNav
        dimensions={DIMENSIONS}
        selectedDimension={selectedDimension}
        facets={facets}
        selectedFacet={selectedFacet}
        traits={traits}
        selectedTrait={selectedTrait}
        onDimensionSelect={handleDimensionSelect}
        onFacetSelect={handleFacetSelect}
        onTraitSelect={handleTraitSelect}
      />

      {/* Colors grid or welcome message */}
      {!selectedDimension ? (
        <div className="text-center py-12 text-zinc-500 bg-zinc-50 rounded-lg">
          <p className="text-lg font-medium text-zinc-700">
            Select a dimension to explore colors
          </p>
          <p className="text-sm mt-1">
            Choose from Sincerity, Excitement, Competence, Sophistication, or Ruggedness
          </p>
        </div>
      ) : (
        <ColorGrid
          colors={colors}
          totalCount={totalCount}
          showingAll={showAllColors}
          onShowAll={handleShowAll}
          onColorClick={handleColorClick}
          selectedDimension={selectedDimension}
          selectedFacet={selectedFacet}
        />
      )}
    </div>
  );
}
