'use client';

import React, { useRef } from 'react';
import { TONES } from '@/lib/constants';
import { formatTk, ratio } from '@/lib/format';
import { useCurrencySymbol } from './CurrencyContext';
import { useChartInteraction } from './useChartInteraction';

export interface RingDatum {
  label: string;
  value: number;
  target: number;
  tone: string;
}

interface ActivityRingsProps {
  rings: RingDatum[];
  size?: number;
  activeIndex?: number | null;
  onHover?: (index: number | null) => void;
  onSelectRing?: (index: number) => void;
  onFocusRing?: (index: number) => void;
  onBlurRing?: (stillInside: boolean) => void;
  onNotePointerDown?: (pointerType?: string) => void;
  onNotePointerEnter?: (pointerType?: string) => void;
  onDismiss?: () => void;
}

/** Concentric progress rings in the style of Apple Watch Activity. */
export function ActivityRings({
  rings,
  size = 208,
  activeIndex: controlledIndex,
  onHover,
  onSelectRing,
  onFocusRing,
  onBlurRing,
  onNotePointerDown,
  onNotePointerEnter,
  onDismiss,
}: ActivityRingsProps) {
  const symbol = useCurrencySymbol();
  const containerRef = useRef<HTMLDivElement>(null);
  const isControlled = controlledIndex !== undefined;
  const interaction = useChartInteraction(containerRef, { listenOutside: !isControlled });
  const activeIndex = isControlled ? controlledIndex : interaction.activeIndex;

  function handlePointerDown(pointerType?: string) {
    if (onNotePointerDown) onNotePointerDown(pointerType);
    else interaction.notePointerDown(pointerType);
  }

  function handlePointerEnter(pointerType?: string) {
    if (onNotePointerEnter) onNotePointerEnter(pointerType);
    else interaction.notePointerEnter(pointerType);
  }

  function handleHoverEnter(index: number) {
    if (onHover) onHover(index);
    else interaction.hoverItem(index);
  }

  function handleFocusRing(index: number) {
    if (onFocusRing) onFocusRing(index);
    else if (onHover) onHover(index);
    else interaction.focusItem(index);
  }

  function handleBlurRing(stillInside: boolean) {
    if (onBlurRing) onBlurRing(stillInside);
    else if (onHover) {
      if (!stillInside) onHover(null);
    } else interaction.blurItem(stillInside);
  }

  function handleClickRing(index: number) {
    if (onSelectRing) onSelectRing(index);
    else if (onHover) onHover(controlledIndex === index ? null : index);
    else interaction.togglePin(index);
  }

  function handleContainerLeave() {
    if (onHover) onHover(null);
    else interaction.leaveContainer();
  }

  function handleEscape() {
    if (onDismiss) onDismiss();
    else if (onHover) onHover(null);
    else interaction.dismiss();
  }

  const stroke = size * 0.085;
  const gap = stroke * 0.3;
  const center = size / 2;
  const activeRing = activeIndex !== null ? rings[activeIndex] ?? null : null;

  return (
    <div
      ref={containerRef}
      className="relative inline-flex shrink-0 select-none items-center justify-center pt-8"
      onMouseLeave={handleContainerLeave}
    >
      {activeRing && (
        <div
          role="tooltip"
          className="pointer-events-none absolute top-0 left-1/2 z-20 min-w-max -translate-x-1/2 rounded-xl border border-neutral-200 bg-white px-3 py-1.5 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.08)]"
        >
          <span className="mr-2 text-neutral-500">{activeRing.label}</span>
          <span className="tabular-nums text-black">
            {formatTk(activeRing.value, { symbol })}
            {activeRing.target > 0
              ? ` / ${formatTk(activeRing.target, { symbol })}`
              : ''}
          </span>
        </div>
      )}

      {activeRing && (
        <div
          aria-hidden
          className="pointer-events-none absolute flex flex-col items-center justify-center pt-8 text-center"
        >
          <span className="text-[11px] text-neutral-400">{activeRing.label}</span>
          <span className="text-sm tabular-nums text-black">
            {activeRing.target > 0
              ? `${Math.round((activeRing.value / activeRing.target) * 100)}%`
              : 'No goal'}
          </span>
        </div>
      )}

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={rings.map((r) => r.label).join(', ')}
        className="shrink-0 touch-manipulation"
      >
        {rings.map((ring, i) => {
          const radius = center - stroke / 2 - i * (stroke + gap);
          const circumference = 2 * Math.PI * radius;
          const progress = ratio(ring.value, ring.target);
          const dimmed = activeIndex !== null && activeIndex !== i;

          return (
            <g
              key={ring.label}
              tabIndex={0}
              aria-label={`${ring.label}: ${formatTk(ring.value, { symbol })}${ring.target > 0 ? ` of ${formatTk(ring.target, { symbol })}` : ''}`}
              onPointerDown={(e) => handlePointerDown(e.pointerType)}
              onPointerEnter={(e) => handlePointerEnter(e.pointerType)}
              onMouseEnter={() => handleHoverEnter(i)}
              onFocus={() => handleFocusRing(i)}
              onBlur={(e) =>
                handleBlurRing(
                  Boolean(containerRef.current?.contains(e.relatedTarget as Node))
                )
              }
              onClick={() => handleClickRing(i)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleClickRing(i);
                } else if (e.key === 'Escape') {
                  handleEscape();
                }
              }}
              className="touch-manipulation focus:outline-none"
              style={{
                cursor: 'pointer',
                opacity: dimmed ? 0.3 : 1,
                transition: 'opacity 180ms ease',
              }}
            >
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={TONES.track}
                strokeWidth={stroke}
                style={{ pointerEvents: 'stroke' }}
              />
              {progress > 0 && (
                <circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke={ring.tone}
                  strokeWidth={stroke}
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  transform={`rotate(-90 ${center} ${center})`}
                  style={{ transition: 'stroke-dashoffset 700ms ease' }}
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
