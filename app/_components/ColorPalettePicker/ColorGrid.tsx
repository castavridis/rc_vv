"use client";

import { useMemo } from "react";
import { ColorSwatch } from "./ColorSwatch";
import { getColorById } from "@/app/_lib/colors-data";
import { getHierarchyForTrait, getFacetsForDimension } from "@/app/_lib/color-types";
import type { ColorGridProps, EnrichedColorEntry } from "./types";

export function ColorGrid({
  colors,
  totalCount,
  showingAll,
  onShowAll,
  onColorClick,
  selectedDimension,
  selectedFacet,
}: ColorGridProps) {
  const maxScore = useMemo(() => {
    if (colors.length === 0) return 1;
    return Math.max(...colors.map((c) => c.score));
  }, [colors]);

  // Show traits/facets only at dimension level (dimension selected, no facet selected)
  const showTraitsFacets = selectedDimension && !selectedFacet;

  // Enrich colors with relevant traits/facets when at dimension level
  const enrichedColors = useMemo((): EnrichedColorEntry[] => {
    if (!showTraitsFacets || !selectedDimension) return colors;

    const dimensionFacets = new Set(getFacetsForDimension(selectedDimension));

    return colors.map((color) => {
      const fullColorData = getColorById(color.colorId);
      if (!fullColorData) return color;

      const relevantTraits = fullColorData.traitSummary
        .filter((t) => getHierarchyForTrait(t.name)?.dimension === selectedDimension)
        .slice(0, 3);

      const relevantFacets = fullColorData.facetSummary
        .filter((f) => dimensionFacets.has(f.name))
        .slice(0, 2);

      return { ...color, relevantTraits, relevantFacets };
    });
  }, [colors, selectedDimension, showTraitsFacets]);

  if (colors.length === 0) {
    return (
      <div className="text-center py-12 text-zinc-500">
        <p>No colors found for this selection.</p>
        <p className="text-sm mt-1">Try selecting a different trait, facet, or dimension.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {enrichedColors.map((color) => (
          <ColorSwatch
            key={color.colorId}
            color={color}
            maxScore={maxScore}
            onClick={() => onColorClick(color)}
            showTraitsFacets={showTraitsFacets}
          />
        ))}
      </div>

      {/* Show all button */}
      {!showingAll && totalCount > colors.length && (
        <div className="mt-6 text-center">
          <button
            onClick={onShowAll}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Show all {totalCount} colors
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
