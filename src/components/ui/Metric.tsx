import React from 'react';

export function Metric({
  label,
  value,
  detail,
  size = 'md',
}: {
  label: string;
  value: string;
  detail?: React.ReactNode;
  size?: 'md' | 'lg';
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-neutral-500 sm:text-sm">{label}</p>
      <p
        className={`mt-1 whitespace-nowrap tabular-nums tracking-tight sm:mt-1.5 ${
          size === 'lg'
            ? 'text-[2rem] leading-tight sm:text-6xl sm:leading-none'
            : 'text-xl sm:text-3xl'
        }`}
      >
        {value}
      </p>
      {detail && <p className="mt-1.5 text-xs text-neutral-500 sm:mt-2 sm:text-sm">{detail}</p>}
    </div>
  );
}
