import React from 'react';

/** Single-stroke trend line in the style of Apple Stocks. */
export function Sparkline({ values, height = 72 }: { values: number[]; height?: number }) {
  if (values.length < 2) return null;

  const width = 400;
  const min = Math.min(...values);
  const range = Math.max(...values) - min || 1;
  const step = width / (values.length - 1);
  const points = values
    .map((v, i) => `${(i * step).toFixed(1)},${(height - 4 - ((v - min) / range) * (height - 8)).toFixed(1)}`)
    .join(' ');

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
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
  );
}
