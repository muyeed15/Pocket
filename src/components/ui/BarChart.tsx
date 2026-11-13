'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TONES } from '@/lib/constants';
import { formatTk } from '@/lib/format';
import { useCurrencySymbol } from './CurrencyContext';

export interface BarSeries {
  label: string;
  values: number[];
  tone: string;
}

interface BarChartProps {
  series: BarSeries[];
  labels: string[];
  height?: number;
  labelEvery?: number;
  activeIndex?: number;
  onSelect?: (index: number) => void;
  formatLabel?: (label: string, index: number) => string;
  emptyMessage?: string;
}

function getTooltipAlignStyle(index: number, count: number): React.CSSProperties {
  const ratio = count > 0 ? (index + 0.5) / count : 0.5;
  if (ratio < 0.2) return { left: 0 };
  if (ratio > 0.8) return { right: 0 };
  return { left: `${(ratio * 100).toFixed(1)}%`, transform: 'translateX(-50%)' };
}

/** Rounded column chart in the style of Apple Health. */
export function BarChart({
  series,
  labels,
  height = 176,
  labelEvery = 1,
  activeIndex,
  onSelect,
  formatLabel,
  emptyMessage = 'No data recorded yet',
}: BarChartProps) {
  const symbol = useCurrencySymbol();
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const rawMax = Math.max(0, ...series.flatMap((s) => s.values));
  const hasData = rawMax > 0;
  const max = Math.max(1, rawMax);

  useEffect(() => {
    if (hoveredIndex === null) return;
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        setHoveredIndex(null);
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setHoveredIndex(null);
    }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [hoveredIndex]);

  const inspectedIndex = hoveredIndex;
  const inspectedLabel =
    inspectedIndex !== null
      ? (formatLabel
          ? formatLabel(labels[inspectedIndex] ?? '', inspectedIndex)
          : labels[inspectedIndex] ?? '')
      : '';

  if (!hasData) {
    return (
      <div className="pt-2">
        <div className="flex h-16 items-end gap-[3px]">
          {labels.map((label, i) => (
            <div key={`${label}-${i}`} className="flex flex-1 items-end justify-center gap-[2px]">
              {series.map((s) => (
                <div
                  key={s.label}
                  className="h-[3px] w-full max-w-3 rounded-full"
                  style={{ backgroundColor: TONES.track }}
                />
              ))}
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-[3px] text-xs text-neutral-400">
          {labels.map((label, i) => (
            <span key={`${label}-${i}`} className="flex-1 text-center tabular-nums">
              {i % labelEvery === 0 ? label : ''}
            </span>
          ))}
        </div>
        <p className="mt-3 text-center text-xs text-neutral-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="relative pt-12"
      onMouseLeave={() => setHoveredIndex(null)}
    >
      {inspectedIndex !== null && (
        <div
          role="tooltip"
          style={getTooltipAlignStyle(inspectedIndex, labels.length)}
          className="pointer-events-none absolute top-0 z-20 min-w-max rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          <p className="mb-0.5 text-neutral-400">{inspectedLabel}</p>
          <ul className="space-y-0.5">
            {series.map((s) => (
              <li key={s.label} className="flex items-center justify-between gap-4">
                <span className="flex items-center gap-1.5 text-neutral-600">
                  <span
                    className="inline-block size-1.5 rounded-full"
                    style={{ backgroundColor: s.tone }}
                  />
                  {s.label}
                </span>
                <span className="tabular-nums text-black">
                  {formatTk(s.values[inspectedIndex] ?? 0, { symbol })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-end gap-[3px]" style={{ height }}>
        {labels.map((label, i) => {
          const isHovered = hoveredIndex === i;
          const isDimmedBySelection = activeIndex !== undefined && activeIndex !== i;
          const isDimmedByHover = hoveredIndex !== null && hoveredIndex !== i;
          return (
            <div
              key={`${label}-${i}`}
              tabIndex={0}
              aria-label={`${formatLabel ? formatLabel(label, i) : label}: ${series
                .map((s) => `${s.label} ${formatTk(s.values[i] ?? 0, { symbol })}`)
                .join(', ')}`}
              onMouseEnter={() => setHoveredIndex(i)}
              onFocus={() => setHoveredIndex(i)}
              onBlur={(e) => {
                if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                  setHoveredIndex(null);
                }
              }}
              onClick={
                onSelect
                  ? () => onSelect(i)
                  : () => setHoveredIndex((prev) => (prev === i ? null : i))
              }
              onKeyDown={
                onSelect
                  ? (e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect(i);
                      }
                    }
                  : undefined
              }
              className={`flex h-full flex-1 items-end justify-center gap-[2px] rounded-t transition-opacity focus:outline-none ${
                onSelect ? 'cursor-pointer' : 'cursor-default'
              } ${
                isDimmedBySelection
                  ? 'opacity-30 hover:opacity-60'
                  : isDimmedByHover
                    ? 'opacity-45'
                    : ''
              } ${isHovered ? 'bg-neutral-50' : ''}`}
            >
              {series.map((s) => {
                const value = s.values[i] ?? 0;
                return (
                  <div
                    key={s.label}
                    title={`${s.label}, ${label}: ${formatTk(value, { symbol })}`}
                    className="w-full max-w-3 rounded-full transition-[height,background-color]"
                    style={{
                      height: value > 0 ? `${Math.max(3, (value / max) * 100)}%` : 3,
                      backgroundColor: value > 0 ? s.tone : TONES.track,
                    }}
                  />
                );
              })}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex gap-[3px] text-xs text-neutral-400">
        {labels.map((label, i) => (
          <span
            key={`${label}-${i}`}
            className={`flex-1 text-center tabular-nums transition-colors ${
              hoveredIndex === i ? 'text-black' : ''
            }`}
          >
            {i % labelEvery === 0 ? label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
