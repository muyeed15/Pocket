'use client';

import React, { useRef } from 'react';
import { TONES } from '@/lib/constants';
import { ActivityRings, type RingDatum } from '@/components/ui/ActivityRings';
import { Dot } from '@/components/ui/Legend';
import { useChartInteraction } from '@/components/ui/useChartInteraction';
import type { MonthlySummaryRow } from '@/types/ledger';

export function MonthRings({ summary }: { summary: MonthlySummaryRow }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const interaction = useChartInteraction(containerRef);
  const rings: RingDatum[] = [
    { label: 'Spent', value: summary.spending, target: summary.plannedSpending, tone: TONES.primary },
    { label: 'Saved', value: summary.saved, target: summary.plannedSavings, tone: TONES.secondary },
    { label: 'Earned', value: summary.income, target: summary.plannedIncome, tone: TONES.tertiary },
  ];

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center gap-10 sm:flex-row sm:items-center"
    >
      <ActivityRings
        rings={rings}
        activeIndex={interaction.activeIndex}
        onHover={(idx) =>
          idx === null ? interaction.leaveContainer() : interaction.hoverItem(idx)
        }
        onSelectRing={interaction.togglePin}
        onFocusRing={interaction.focusItem}
        onBlurRing={interaction.blurItem}
        onNotePointerDown={interaction.notePointerDown}
        onNotePointerEnter={interaction.notePointerEnter}
        onDismiss={interaction.dismiss}
      />
      <ul
        className="w-full space-y-3"
        onMouseLeave={interaction.leaveContainer}
      >
        {rings.map((ring, idx) => {
          const dimmed =
            interaction.activeIndex !== null && interaction.activeIndex !== idx;
          return (
            <li key={ring.label}>
              <button
                type="button"
                aria-pressed={interaction.pinnedIndex === idx}
                onPointerDown={(e) => interaction.notePointerDown(e.pointerType)}
                onPointerEnter={(e) => interaction.notePointerEnter(e.pointerType)}
                onMouseEnter={() => interaction.hoverItem(idx)}
                onFocus={() => interaction.focusItem(idx)}
                onBlur={(e) =>
                  interaction.blurItem(
                    Boolean(containerRef.current?.contains(e.relatedTarget as Node))
                  )
                }
                onClick={() => interaction.togglePin(idx)}
                className={`-mx-2 flex w-[calc(100%+1rem)] touch-manipulation select-none items-center gap-3 rounded-xl px-2 py-2 text-left transition-[opacity,background-color] hover:bg-neutral-50 focus:outline-none ${
                  dimmed ? 'opacity-40' : ''
                }`}
              >
                <Dot tone={ring.tone} />
                <span className="flex-1 text-[17px] text-black">{ring.label}</span>
                <span className="text-sm tabular-nums text-neutral-500">
                  {ring.target > 0
                    ? `${Math.round((ring.value / ring.target) * 100)}%`
                    : 'No goal'}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
