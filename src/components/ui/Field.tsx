'use client';

import React from 'react';
import { IoSearchOutline } from 'react-icons/io5';
import { useCurrencySymbol } from './CurrencyContext';

export const fieldClass =
  'w-full rounded-none border-0 border-b border-neutral-200 bg-transparent px-0 py-2 text-[17px] text-black placeholder:text-neutral-400 focus:border-black focus:outline-none focus:ring-0';

/** Inline currency-prefixed numeric field with shared underline focus state. */
export function MoneyInput({
  className = 'text-3xl',
  inputClassName = '',
  symbol: symbolOverride,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  symbol?: string;
  inputClassName?: string;
}) {
  const contextSymbol = useCurrencySymbol();
  const symbol = symbolOverride ?? contextSymbol;

  return (
    <div
      className={`flex items-baseline gap-2 border-b border-neutral-200 focus-within:border-black ${className}`}
    >
      <span className="shrink-0 select-none text-[0.55em] text-neutral-400">
        {symbol}
      </span>
      <input
        type="number"
        className={`w-full min-w-0 border-0 bg-transparent px-0 py-2 text-black tabular-nums placeholder:text-neutral-400 focus:outline-none focus:ring-0 ${inputClassName}`}
        {...props}
      />
    </div>
  );
}

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

/** Shared search input used across Ledger and Settings filter bars. */
export function SearchField({
  value,
  onChange,
  label,
  placeholder = 'Search',
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <label className={`relative flex min-w-44 flex-1 items-center ${className}`}>
      <IoSearchOutline className="pointer-events-none absolute left-0 text-base text-neutral-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="w-full bg-transparent py-1.5 pl-6 text-[16px] text-black placeholder:text-neutral-400 focus:outline-none"
      />
    </label>
  );
}
