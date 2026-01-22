'use client';

import { useState, useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import MaskLayer from './MaskLayer';
import { INITIAL_LAYER_CONFIGS } from './constants';
import { BrandMaskVisualizationProps, LayerConfig, GradientSpot } from './types';

gsap.registerPlugin(useGSAP);

// Deep clone helper for animation data
function cloneSpots(configs: LayerConfig[]): GradientSpot[][] {
  return configs.map((config) =>
    config.gradientSpots.map((spot) => ({ ...spot }))
  );
}

export default function BrandMaskVisualization({
  autoPlay = true,
  animationDuration = 10,
  className,
}: BrandMaskVisualizationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);
  const [layerConfigs, setLayerConfigs] = useState<LayerConfig[]>(INITIAL_LAYER_CONFIGS);
  const [isAnimating, setIsAnimating] = useState(autoPlay);

  const { contextSafe } = useGSAP(
    () => {
      // Animation data object - GSAP mutates this directly
      const animationData = {
        spots: cloneSpots(INITIAL_LAYER_CONFIGS),
      };

      const tl = gsap.timeline({
        repeat: -1,
        yoyo: true,
        paused: !autoPlay,
        onUpdate: () => {
          // Convert animation data back to layer configs
          setLayerConfigs((prevConfigs) =>
            prevConfigs.map((config, layerIndex) => ({
              ...config,
              gradientSpots: animationData.spots[layerIndex].map((spot) => ({
                ...spot,
              })),
            }))
          );
        },
      });

      // Animate each layer's gradient spots
      INITIAL_LAYER_CONFIGS.forEach((config, layerIndex) => {
        config.gradientSpots.forEach((spot, spotIndex) => {
          const spotRef = animationData.spots[layerIndex][spotIndex];

          // Stagger animations per layer for organic feel
          const staggerDelay = layerIndex * 0.8 + spotIndex * 0.4;

          // Position animation - wandering movement
          tl.to(
            spotRef,
            {
              x: gsap.utils.random(10, 90),
              y: gsap.utils.random(10, 90),
              duration: animationDuration / 2,
              ease: 'sine.inOut',
            },
            staggerDelay
          );

          // Size animation - breathing effect
          tl.to(
            spotRef,
            {
              radius: gsap.utils.random(12, 30),
              duration: animationDuration / 3,
              ease: 'power1.inOut',
            },
            staggerDelay + 0.2
          );

          // Opacity animation - pulsing
          tl.to(
            spotRef,
            {
              opacity: gsap.utils.random(0.6, 1),
              duration: animationDuration / 4,
              ease: 'power2.inOut',
            },
            staggerDelay + 0.4
          );
        });
      });

      timelineRef.current = tl;

      return () => {
        tl.kill();
      };
    },
    { scope: containerRef, dependencies: [animationDuration, autoPlay] }
  );

  const handlePlayPause = contextSafe(() => {
    if (timelineRef.current) {
      if (isAnimating) {
        timelineRef.current.pause();
      } else {
        timelineRef.current.play();
      }
      setIsAnimating(!isAnimating);
    }
  });

  const handleRestart = contextSafe(() => {
    if (timelineRef.current) {
      timelineRef.current.restart();
      setIsAnimating(true);
    }
  });

  return (
    <div className={className}>
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl shadow-2xl bg-zinc-900"
        style={{ width: 500, height: 500 }}
      >
        {/* Base background */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900" />

        {/* Mask layers */}
        {layerConfigs.map((config) => (
          <MaskLayer
            key={config.dimension}
            config={config}
            isAnimating={isAnimating}
          />
        ))}

        {/* Controls overlay */}
        <div className="absolute bottom-4 right-4 flex gap-2 z-50">
          <button
            onClick={handlePlayPause}
            className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm text-white text-sm hover:bg-white/20 transition-colors"
          >
            {isAnimating ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={handleRestart}
            className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm text-white text-sm hover:bg-white/20 transition-colors"
          >
            Restart
          </button>
        </div>

        {/* Legend */}
        <div className="absolute top-4 left-4 flex flex-col gap-1 z-50">
          {layerConfigs.map((config) => (
            <div
              key={config.dimension}
              className="flex items-center gap-2 text-xs text-white/80"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: config.color }}
              />
              <span>{config.dimension}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
