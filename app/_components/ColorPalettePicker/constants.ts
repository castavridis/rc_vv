import type { Dimension } from "@/app/_lib/color-types";

export const DEFAULT_COLOR_LIMIT = 12;

export const DIMENSION_COLORS: Record<Dimension, string> = {
  Sincerity: "#EF4444", // red-500
  Excitement: "#EAB308", // yellow-500
  Competence: "#3B82F6", // blue-500
  Sophistication: "#22C55E", // green-500
  Ruggedness: "#A855F7", // purple-500
};

export const DIMENSION_BG_CLASSES: Record<Dimension, string> = {
  Sincerity: "bg-red-500",
  Excitement: "bg-yellow-500",
  Competence: "bg-blue-500",
  Sophistication: "bg-green-500",
  Ruggedness: "bg-purple-500",
};

export const DIMENSION_HOVER_CLASSES: Record<Dimension, string> = {
  Sincerity: "hover:bg-red-600",
  Excitement: "hover:bg-yellow-600",
  Competence: "hover:bg-blue-600",
  Sophistication: "hover:bg-green-600",
  Ruggedness: "hover:bg-purple-600",
};

export const DIMENSION_RING_CLASSES: Record<Dimension, string> = {
  Sincerity: "ring-red-500",
  Excitement: "ring-yellow-500",
  Competence: "ring-blue-500",
  Sophistication: "ring-green-500",
  Ruggedness: "ring-purple-500",
};
