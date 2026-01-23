"use client";

import type { BreadcrumbNavProps } from "./types";

export function BreadcrumbNav({
  dimension,
  facet,
  trait,
  onNavigateToRoot,
  onNavigateToDimension,
  onNavigateToFacet,
}: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center gap-1 text-sm mb-4">
      <button
        onClick={onNavigateToRoot}
        className={`hover:text-blue-600 transition-colors ${
          !dimension ? "text-zinc-900 font-medium" : "text-zinc-500"
        }`}
      >
        All Dimensions
      </button>

      {dimension && (
        <>
          <ChevronRight />
          <button
            onClick={onNavigateToDimension}
            className={`hover:text-blue-600 transition-colors ${
              dimension && !facet ? "text-zinc-900 font-medium" : "text-zinc-500"
            }`}
          >
            {dimension}
          </button>
        </>
      )}

      {facet && (
        <>
          <ChevronRight />
          <button
            onClick={onNavigateToFacet}
            className={`hover:text-blue-600 transition-colors ${
              facet && !trait ? "text-zinc-900 font-medium" : "text-zinc-500"
            }`}
          >
            {facet}
          </button>
        </>
      )}

      {trait && (
        <>
          <ChevronRight />
          <span className="text-zinc-900 font-medium">{trait}</span>
        </>
      )}
    </nav>
  );
}

function ChevronRight() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4 text-zinc-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5l7 7-7 7"
      />
    </svg>
  );
}
