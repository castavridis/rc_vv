'use client';

import { useMemo } from 'react';
import { getFacetsForDimension } from '@/app/lib/brand';
import { MaskLayerProps } from './types';

export default function MaskLayer({ config, isAnimating }: MaskLayerProps) {
  const { dimension, color, gradientSpots, zIndex } = config;

  // Generate CSS mask-image from gradient spots
  const maskImage = useMemo(() => {
    return gradientSpots
      .map((spot) => {
        // Radial gradient: white center (visible) fading to transparent (hidden)
        return `radial-gradient(circle at ${spot.x}% ${spot.y}%, rgba(255,255,255,${spot.opacity}) 0%, rgba(255,255,255,${spot.opacity * 0.5}) ${spot.radius * 0.5}%, transparent ${spot.radius}%)`;
      })
      .join(', ');
  }, [gradientSpots]);

  const facets = getFacetsForDimension(dimension);

  return (
    <div
      className="overflow-hidden"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: 500,
        height: 500,
        backgroundColor: color,
        zIndex,
        maskImage,
        WebkitMaskImage: maskImage,
        maskComposite: 'add',
        WebkitMaskComposite: 'source-over' as unknown as string,
        willChange: isAnimating ? 'mask-image, -webkit-mask-image' : 'auto',
      }}
      data-dimension={dimension}
    >
      {/* Content revealed by the mask */}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white">
        <h3 className="text-2xl font-bold mb-4 drop-shadow-lg">
          {dimension}
        </h3>
        <div className="flex flex-wrap gap-2 justify-center max-w-md">
          {facets.map((facet) => (
            <span
              key={facet}
              className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm text-sm"
            >
              {facet}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
