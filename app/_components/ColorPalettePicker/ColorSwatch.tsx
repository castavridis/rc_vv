"use client";

import { useState } from "react";
import type { ColorSwatchProps } from "./types";

export function ColorSwatch({ color, maxScore, onClick }: ColorSwatchProps) {
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    try {
      await navigator.clipboard.writeText(color.hex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = color.hex;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
    onClick();
  };

  const scorePercent = maxScore > 0 ? (color.score / maxScore) * 100 : 0;

  return (
    <button
      onClick={handleClick}
      className="group flex flex-col rounded-lg border border-zinc-200 bg-white overflow-hidden transition-all hover:shadow-md hover:border-zinc-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      {/* Color block */}
      <div
        className="aspect-square w-full relative"
        style={{ backgroundColor: color.hex }}
      >
        {copied && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <span className="text-white text-sm font-medium">Copied!</span>
          </div>
        )}
      </div>

      {/* Info section */}
      <div className="p-3 text-left w-full">
        {/* Color name */}
        <p className="font-medium text-zinc-900 text-sm truncate">
          {color.colorName}
        </p>

        {/* Hex code */}
        <p className="text-xs text-zinc-500 font-mono mt-0.5">{color.hex}</p>

        {/* Score bar */}
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
            <span>Score</span>
            <span>{color.score.toFixed(2)}</span>
          </div>
          <div className="h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
        </div>

        {/* Occurrences */}
        <p className="text-xs text-zinc-400 mt-1.5">
          {color.occurrences} {color.occurrences === 1 ? "match" : "matches"}
        </p>
      </div>
    </button>
  );
}
