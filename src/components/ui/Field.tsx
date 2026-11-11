import React from 'react';

export const fieldClass =
  'w-full rounded-none border-0 border-b border-neutral-200 bg-transparent px-0 py-2 text-[17px] text-black placeholder:text-neutral-300 focus:border-black focus:outline-none focus:ring-0';

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm text-neutral-500">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-xs text-neutral-400">{hint}</span>}
    </label>
  );
}
