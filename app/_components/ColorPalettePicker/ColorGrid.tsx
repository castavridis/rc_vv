"use client";

import { useMemo } from "react";
import { ColorSwatch } from "./ColorSwatch";
import type { ColorGridProps } from "./types";

export function ColorGrid({
  colors,
  totalCount,
  showingAll,
  onShowAll,
  onColorClick,
}: ColorGridProps) {
  const maxScore = useMemo(() => {
    if (colors.length === 0) return 1;
    return Math.max(...colors.map((c) => c.score));
  }, [colors]);

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
        {colors.map((color) => (
          <ColorSwatch
            key={color.colorId}
            color={color}
            maxScore={maxScore}
            onClick={() => onColorClick(color)}
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
