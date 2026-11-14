'use client';

import { useEffect, useRef } from 'react';

/** Immediately scrolls the browser viewport to the top without smooth-scroll lag. */
export function scrollWindowToTop(): void {
  if (typeof window === 'undefined' || typeof window.scrollTo !== 'function') return;
  window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
}

/**
 * Resets viewport scroll to the top whenever the dependency key changes after initial mount
 * (e.g., tab switches, drill-down presets, or browser history popstate navigation).
 */
export function useResetScrollOnChange(changeKey: string): void {
  const hasMountedRef = useRef(false);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return;
    }
    scrollWindowToTop();
  }, [changeKey]);
}
