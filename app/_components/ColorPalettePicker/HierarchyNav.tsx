"use client";

import type { Dimension } from "@/app/_lib/color-types";
import { DIMENSION_COLORS } from "./constants";
import type { HierarchyNavProps } from "./types";

export function HierarchyNav({
  dimensions,
  selectedDimension,
  facets,
  selectedFacet,
  traits,
  selectedTrait,
  onDimensionSelect,
  onFacetSelect,
  onTraitSelect,
}: HierarchyNavProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Dimensions row */}
      <div>
        <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
          Dimensions
        </label>
        <div className="flex flex-wrap gap-2">
          {dimensions.map((dimension) => (
            <DimensionPill
              key={dimension}
              dimension={dimension}
              isSelected={selectedDimension === dimension}
              onClick={() => onDimensionSelect(dimension)}
            />
          ))}
        </div>
      </div>

      {/* Facets row */}
      {facets.length > 0 && (
        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
            Facets
          </label>
          <div className="flex flex-wrap gap-2">
            {facets.map((facet) => (
              <button
                key={facet}
                onClick={() => onFacetSelect(facet)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                  selectedFacet === facet
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {facet}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Traits row */}
      {traits.length > 0 && (
        <div>
          <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2 block">
            Traits
          </label>
          <div className="flex flex-wrap gap-2">
            {traits.map((trait) => (
              <button
                key={trait}
                onClick={() => onTraitSelect(trait)}
                className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                  selectedTrait === trait
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
                }`}
              >
                {trait}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DimensionPill({
  dimension,
  isSelected,
  onClick,
}: {
  dimension: Dimension;
  isSelected: boolean;
  onClick: () => void;
}) {
  const color = DIMENSION_COLORS[dimension];

  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-sm rounded-full transition-all flex items-center gap-2 ${
        isSelected
          ? "ring-2 ring-offset-2"
          : "hover:opacity-80"
      }`}
      style={{
        backgroundColor: color,
        color: "white",
        ...(isSelected && { "--tw-ring-color": color } as React.CSSProperties),
      }}
    >
      {dimension}
    </button>
  );
}
