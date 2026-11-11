import React from 'react';
import { TONES } from '@/lib/constants';
import { ratio } from '@/lib/format';

export interface RingDatum {
  label: string;
  value: number;
  target: number;
  tone: string;
}

/** Concentric progress rings in the style of Apple Watch Activity. */
export function ActivityRings({ rings, size = 208 }: { rings: RingDatum[]; size?: number }) {
  const stroke = size * 0.085;
  const gap = stroke * 0.3;
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={rings.map((r) => r.label).join(', ')}
      className="shrink-0"
    >
      {rings.map((ring, i) => {
        const radius = center - stroke / 2 - i * (stroke + gap);
        const circumference = 2 * Math.PI * radius;
        const progress = ratio(ring.value, ring.target);
        return (
          <g key={ring.label}>
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke={TONES.track}
              strokeWidth={stroke}
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
  );
}
