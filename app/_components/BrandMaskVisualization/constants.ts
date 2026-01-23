import { Dimension, DIMENSIONS } from '@/app/_lib/brand';
import { LayerConfig } from './types';

export const DIMENSION_COLORS: Record<Dimension, string> = {
  Sincerity: '#EF4444',      // red-500
  Excitement: '#EAB308',     // yellow-500
  Competence: '#3B82F6',     // blue-500
  Sophistication: '#22C55E', // green-500
  Ruggedness: '#A855F7',     // purple-500
};

export const INITIAL_LAYER_CONFIGS: LayerConfig[] = DIMENSIONS.map(
  (dimension, index) => ({
    dimension,
    color: DIMENSION_COLORS[dimension],
    zIndex: index + 1,
    gradientSpots: [
      // 3 spots per layer for visual interest, spread across the area
      { id: `${dimension}-1`, x: 15 + index * 8, y: 25 + index * 5, radius: 18, opacity: 0.85 },
      { id: `${dimension}-2`, x: 55 - index * 6, y: 65 + index * 3, radius: 22, opacity: 0.75 },
      { id: `${dimension}-3`, x: 75 + index * 3, y: 35 - index * 4, radius: 15, opacity: 0.9 },
    ],
  })
);
