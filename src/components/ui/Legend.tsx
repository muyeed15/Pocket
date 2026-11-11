import React from 'react';

export function Dot({ tone }: { tone: string }) {
  return (
    <span
      aria-hidden
      className="inline-block size-2.5 shrink-0 rounded-full"
      style={{ backgroundColor: tone }}
    />
  );
}

export function Legend({ items }: { items: Array<{ label: string; tone: string }> }) {
  return (
    <div className="flex items-center gap-5 text-sm text-neutral-500">
      {items.map((item) => (
        <span key={item.label} className="inline-flex items-center gap-2">
          <Dot tone={item.tone} />
          {item.label}
        </span>
      ))}
    </div>
  );
}
