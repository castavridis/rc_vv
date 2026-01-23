'use client';

import { useEffect, useRef } from 'react';

interface RadarChartProps {
  data: Record<string, number>;
  width?: number;
  height?: number;
  fillColor?: string;
  fillOpacity?: number;
  strokeColor?: string;
  strokeWidth?: number;
  title?: string;
  className?: string;
}

function validateData(data: Record<string, number>): { valid: boolean; error?: string } {
  const keys = Object.keys(data);
  if (keys.length === 0) {
    return { valid: false, error: 'Data cannot be empty' };
  }
  if (keys.length < 3) {
    return { valid: false, error: 'Radar chart requires at least 3 dimensions' };
  }
  return { valid: true };
}

function clampValue(value: number): number {
  return Math.max(1, Math.min(7, value));
}

function polarToCartesian(angle: number, radius: number, centerX: number, centerY: number, scale: number) {
  return {
    x: centerX + Math.cos(angle) * radius * scale,
    y: centerY + Math.sin(angle) * radius * scale,
  };
}

function createRadarChart(
  data: Record<string, number>,
  options: {
    width: number;
    height: number;
    fillColor: string;
    fillOpacity: number;
    strokeColor: string;
    strokeWidth: number;
    title?: string;
  }
): SVGSVGElement {
  const { width, height, fillColor, fillOpacity, strokeColor, strokeWidth, title } = options;
  const keys = Object.keys(data);
  const numDimensions = keys.length;
  const angleStep = (2 * Math.PI) / numDimensions;

  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.min(width, height) / 2 - 40; // Leave room for labels

  // Create reference circles (levels 1-7)
  const levels = [1, 2, 3, 4, 5, 6, 7];
  const circleData: { level: number; x: number; y: number }[] = [];

  levels.forEach(level => {
    const radius = (level / 7) * maxRadius;
    for (let i = 0; i <= 360; i += 2) {
      const angle = (i * Math.PI) / 180;
      const { x, y } = polarToCartesian(angle, 1, centerX, centerY, radius);
      circleData.push({ level, x, y });
    }
  });

  // Create axis lines from center to edge
  const axisData: { key: string; x: number; y: number; order: number }[] = [];
  keys.forEach((key, i) => {
    const angle = i * angleStep - Math.PI / 2; // Start from top
    axisData.push({ key, x: centerX, y: centerY, order: 0 });
    const { x, y } = polarToCartesian(angle, 1, centerX, centerY, maxRadius);
    axisData.push({ key, x, y, order: 1 });
  });

  // Create data points
  const dataPoints: { key: string; value: number; x: number; y: number; order: number }[] = [];
  keys.forEach((key, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const value = clampValue(data[key]);
    const radius = (value / 7) * maxRadius;
    const { x, y } = polarToCartesian(angle, 1, centerX, centerY, radius);
    dataPoints.push({ key, value, x, y, order: i });
  });
  // Close the polygon
  if (dataPoints.length > 0) {
    dataPoints.push({ ...dataPoints[0], order: dataPoints.length });
  }

  // Create labels
  const labelData = keys.map((key, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const labelRadius = maxRadius + 20;
    const { x, y } = polarToCartesian(angle, 1, centerX, centerY, labelRadius);
    return { key, x, y };
  });

  // Create level labels (on the right axis, level 1)
  const levelLabels = levels.map(level => {
    const radius = (level / 7) * maxRadius;
    return { level: String(level), x: centerX + 8, y: centerY - radius };
  });

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  // Add title if provided
  if (title) {
    const titleEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    titleEl.setAttribute('x', String(centerX));
    titleEl.setAttribute('y', '20');
    titleEl.setAttribute('text-anchor', 'middle');
    titleEl.setAttribute('font-size', '14');
    titleEl.setAttribute('font-weight', '600');
    titleEl.textContent = title;
    svg.appendChild(titleEl);
  }

  // Draw reference circles
  levels.forEach(level => {
    const radius = (level / 7) * maxRadius;
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(centerX));
    circle.setAttribute('cy', String(centerY));
    circle.setAttribute('r', String(radius));
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', '#e5e7eb');
    circle.setAttribute('stroke-width', '1');
    svg.appendChild(circle);
  });

  // Draw axis lines
  keys.forEach((_, i) => {
    const angle = i * angleStep - Math.PI / 2;
    const { x: endX, y: endY } = polarToCartesian(angle, 1, centerX, centerY, maxRadius);
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(centerX));
    line.setAttribute('y1', String(centerY));
    line.setAttribute('x2', String(endX));
    line.setAttribute('y2', String(endY));
    line.setAttribute('stroke', '#d1d5db');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  });

  // Draw data polygon (fill)
  const polygonPoints = dataPoints.slice(0, -1).map(p => `${p.x},${p.y}`).join(' ');
  const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  polygon.setAttribute('points', polygonPoints);
  polygon.setAttribute('fill', fillColor);
  polygon.setAttribute('fill-opacity', String(fillOpacity));
  polygon.setAttribute('stroke', strokeColor);
  polygon.setAttribute('stroke-width', String(strokeWidth));
  svg.appendChild(polygon);

  // Draw data points
  dataPoints.slice(0, -1).forEach(point => {
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', String(point.x));
    dot.setAttribute('cy', String(point.y));
    dot.setAttribute('r', '4');
    dot.setAttribute('fill', strokeColor);
    svg.appendChild(dot);
  });

  // Draw labels
  labelData.forEach(label => {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(label.x));
    text.setAttribute('y', String(label.y));
    text.setAttribute('text-anchor', 'middle');
    text.setAttribute('dominant-baseline', 'middle');
    text.setAttribute('font-size', '12');
    text.setAttribute('font-weight', '500');
    text.setAttribute('fill', '#374151');
    text.textContent = label.key;
    svg.appendChild(text);
  });

  // Draw level labels
  levelLabels.forEach(label => {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', String(label.x));
    text.setAttribute('y', String(label.y));
    text.setAttribute('font-size', '10');
    text.setAttribute('fill', '#9ca3af');
    text.textContent = label.level;
    svg.appendChild(text);
  });

  return svg;
}

export default function RadarChart({
  data,
  width = 400,
  height = 400,
  fillColor = 'steelblue',
  fillOpacity = 0.3,
  strokeColor = 'steelblue',
  strokeWidth = 2,
  title,
  className,
}: RadarChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const validation = validateData(data);

  useEffect(() => {
    if (!containerRef.current || !validation.valid) return;

    const chart = createRadarChart(data, {
      width,
      height,
      fillColor,
      fillOpacity,
      strokeColor,
      strokeWidth,
      title,
    });

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(chart);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [data, width, height, fillColor, fillOpacity, strokeColor, strokeWidth, title, validation.valid]);

  if (!validation.valid) {
    return (
      <div className={className}>
        <div
          className="flex items-center justify-center bg-zinc-100 rounded-lg text-zinc-500"
          style={{ width, height }}
        >
          {validation.error}
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        ref={containerRef}
        style={{ width, height }}
        className="flex items-center justify-center"
      >
        {/* Placeholder during SSR */}
        <div className="text-zinc-400">Loading chart...</div>
      </div>
    </div>
  );
}
