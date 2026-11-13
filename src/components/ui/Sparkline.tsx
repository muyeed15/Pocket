'use client';

import React, { useRef, useState } from 'react';
import { formatTk } from '@/lib/format';
import { useCurrencySymbol } from './CurrencyContext';

function getScrubTooltipStyle(index: number, count: number): React.CSSProperties {
  const ratio = count > 1 ? index / (count - 1) : 0.5;
  if (ratio < 0.2) return { left: 0 };
  if (ratio > 0.8) return { right: 0 };
  return { left: `${(ratio * 100).toFixed(1)}%`, transform: 'translateX(-50%)' };
}

/** Interactive single-stroke trend line in the style of Apple Stocks. */
export function Sparkline({
  values,
  labels,
  height = 72,
}: {
  values: number[];
  labels?: string[];
  height?: number;
}) {
  const symbol = useCurrencySymbol();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (values.length < 2) return null;

  const width = 400;
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const step = width / (values.length - 1);

  const coords = values.map((v, i) => ({
    xPct: (i / (values.length - 1)) * 100,
    yPx: height - 4 - ((v - min) / range) * (height - 8),
    xSvg: i * step,
  }));

  const points = coords
    .map((c) => `${c.xSvg.toFixed(1)},${c.yPx.toFixed(1)}`)
    .join(' ');

  function updateFromClientX(clientX: number) {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect || rect.width <= 0) return;
    const clamped = Math.min(Math.max(clientX - rect.left, 0), rect.width);
    const idx = Math.round((clamped / rect.width) * (values.length - 1));
    setHoveredIndex(idx);
  }

  const active = hoveredIndex !== null ? coords[hoveredIndex] : null;
  const activeValue = hoveredIndex !== null ? values[hoveredIndex] : null;
  const activeLabel =
    hoveredIndex !== null ? (labels?.[hoveredIndex] ?? `Day ${hoveredIndex + 1}`) : '';

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="img"
      aria-label="Daily cash balance trend"
      onMouseMove={(e) => updateFromClientX(e.clientX)}
      onMouseLeave={() => setHoveredIndex(null)}
      onTouchMove={(e) => {
        if (e.touches[0]) updateFromClientX(e.touches[0].clientX);
      }}
      onTouchEnd={() => setHoveredIndex(null)}
      onKeyDown={(e) => {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          setHoveredIndex((prev) =>
            prev === null ? values.length - 1 : Math.max(0, prev - 1)
          );
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          setHoveredIndex((prev) =>
            prev === null ? 0 : Math.min(values.length - 1, prev + 1)
          );
        } else if (e.key === 'Escape') {
          setHoveredIndex(null);
        }
      }}
      onBlur={() => setHoveredIndex(null)}
      className="relative w-full cursor-crosshair select-none pt-8 focus:outline-none"
    >
      {hoveredIndex !== null && activeValue !== null && (
        <div
          role="tooltip"
          style={getScrubTooltipStyle(hoveredIndex, values.length)}
          className="pointer-events-none absolute top-0 z-20 min-w-max rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          <span className="mr-2 text-neutral-400">{activeLabel}</span>
          <span className="tabular-nums text-black">{formatTk(activeValue, { symbol })}</span>
        </div>
      )}

      <div className="relative w-full" style={{ height }}>
        {active && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-neutral-300"
              style={{ left: `${active.xPct}%` }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black ring-4 ring-white"
              style={{ left: `${active.xPct}%`, top: `${active.yPx}px` }}
            />
          </>
        )}

        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="h-full w-full"
          aria-hidden
        >
          <polyline
            points={points}
            fill="none"
            stroke="#000"
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}
