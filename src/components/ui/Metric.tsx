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
    <div>
      <p className="text-sm text-neutral-500">{label}</p>
      <p
        className={`mt-2 tabular-nums tracking-tight ${
          size === 'lg' ? 'text-5xl sm:text-7xl' : 'text-3xl'
        }`}
      >
        {value}
      </p>
      {detail && <p className="mt-3 text-sm text-neutral-500">{detail}</p>}
    </div>
  );
}
