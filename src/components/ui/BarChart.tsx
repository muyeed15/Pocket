import React from 'react';
import { TONES } from '@/lib/constants';
import { formatTk } from '@/lib/format';

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
}

/** Rounded column chart in the style of Apple Health. */
export function BarChart({
  series,
  labels,
  height = 176,
  labelEvery = 1,
  activeIndex,
  onSelect,
}: BarChartProps) {
  const max = Math.max(1, ...series.flatMap((s) => s.values));

  return (
    <div>
      <div className="flex items-end gap-[3px]" style={{ height }}>
        {labels.map((label, i) => {
          const dimmed = activeIndex !== undefined && activeIndex !== i;
          return (
            <div
              key={`${label}-${i}`}
              onClick={onSelect ? () => onSelect(i) : undefined}
              className={`flex h-full flex-1 items-end justify-center gap-[2px] transition-opacity ${
                onSelect ? 'cursor-pointer' : ''
              } ${dimmed ? 'opacity-30 hover:opacity-60' : ''}`}
            >
              {series.map((s) => {
                const value = s.values[i] ?? 0;
                return (
                  <div
                    key={s.label}
                    title={`${s.label}, ${label}: ${formatTk(value)}`}
                    className="w-full max-w-3 rounded-full"
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
          <span key={`${label}-${i}`} className="flex-1 text-center tabular-nums">
            {i % labelEvery === 0 ? label : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
