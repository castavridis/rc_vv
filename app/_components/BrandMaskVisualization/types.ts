import { Dimension } from '@/app/_lib/brand';

export interface GradientSpot {
  id: string;
  x: number;      // percentage 0-100
  y: number;      // percentage 0-100
  radius: number; // percentage 0-100
  opacity: number; // 0-1
}

export interface LayerConfig {
  dimension: Dimension;
  color: string;
  gradientSpots: GradientSpot[];
  zIndex: number;
}

export interface BrandMaskVisualizationProps {
  autoPlay?: boolean;
  animationDuration?: number;
  className?: string;
}

export interface MaskLayerProps {
  config: LayerConfig;
  isAnimating: boolean;
}
