'use client';

import { useState } from 'react';

/**
 * Manages filter state that supports both standalone local state and parent-controlled
 * persistence across tab unmounts/remounts.
 */
export function useControlledFilters<T extends object>(
  controlledValue: T | undefined,
  initialValue: T,
  onChange?: (next: T) => void
): [T, (patch: Partial<T>) => void] {
  const [localValue, setLocalValue] = useState<T>(initialValue);
  const current = controlledValue ?? localValue;

  function updateFilters(patch: Partial<T>) {
    const next = { ...current, ...patch };
    if (controlledValue === undefined) {
      setLocalValue(next);
    }
    onChange?.(next);
  }

  return [current, updateFilters];
}
