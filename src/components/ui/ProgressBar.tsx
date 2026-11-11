import React from 'react';
import { ratio } from '@/lib/format';

export function ProgressBar({ value, target }: { value: number; target: number }) {
  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-neutral-100">
      <div
        className="h-full rounded-full bg-black transition-[width] duration-500"
        style={{ width: `${ratio(value, target) * 100}%` }}
      />
    </div>
  );
}
