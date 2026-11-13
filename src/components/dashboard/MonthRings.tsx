'use client';

import React, { useState } from 'react';
import { TONES } from '@/lib/constants';
import { formatTk } from '@/lib/format';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import { ActivityRings, type RingDatum } from '@/components/ui/ActivityRings';
import { Dot } from '@/components/ui/Legend';
import type { MonthlySummaryRow } from '@/types/ledger';

export function MonthRings({ summary }: { summary: MonthlySummaryRow }) {
  const symbol = useCurrencySymbol();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const rings: RingDatum[] = [
    { label: 'Spent', value: summary.spending, target: summary.plannedSpending, tone: TONES.primary },
    { label: 'Saved', value: summary.saved, target: summary.plannedSavings, tone: TONES.secondary },
    { label: 'Earned', value: summary.income, target: summary.plannedIncome, tone: TONES.tertiary },
  ];

  return (
    <div className="flex flex-col items-center gap-10 sm:flex-row sm:items-center">
      <ActivityRings
        rings={rings}
        activeIndex={hoveredIndex}
        onHover={setHoveredIndex}
      />
      <ul
        className="w-full space-y-6"
        onMouseLeave={() => setHoveredIndex(null)}
      >
        {rings.map((ring, idx) => {
          const dimmed = hoveredIndex !== null && hoveredIndex !== idx;
          return (
            <li
              key={ring.label}
              onMouseEnter={() => setHoveredIndex(idx)}
              onFocus={() => setHoveredIndex(idx)}
              className={`flex cursor-default items-start gap-3 transition-opacity ${
                dimmed ? 'opacity-40' : ''
              }`}
            >
              <span className="mt-2">
                <Dot tone={ring.tone} />
              </span>
              <div className="flex-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[17px]">{ring.label}</span>
                  <span className="text-sm tabular-nums text-neutral-500">
                    {ring.target > 0 ? `${Math.round((ring.value / ring.target) * 100)}%` : 'No goal'}
                  </span>
                </div>
                <p className="text-sm tabular-nums text-neutral-500">
                  {ring.target > 0
                    ? `${formatTk(ring.value, { symbol })} of ${formatTk(ring.target, { symbol })}`
                    : `${formatTk(ring.value, { symbol })} so far`}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
