'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type React from 'react';

interface UseChartInteractionOptions {
  /** Disable window outside-dismiss listener when parent owns the outer container. */
  listenOutside?: boolean;
}

/**
 * Coordinates mouse hover, keyboard focus, click/tap pinning, and outside
 * dismissal across charts so synthetic touch hover/focus events never cancel a tap.
 */
export function useChartInteraction(
  containerRef: React.RefObject<HTMLElement | null>,
  { listenOutside = true }: UseChartInteractionOptions = {}
) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const pointerTypeRef = useRef<string | null>(null);
  const pointerFocusedRef = useRef(false);

  const activeIndex = hoveredIndex ?? pinnedIndex;

  const dismiss = useCallback(() => {
    setHoveredIndex(null);
    setPinnedIndex(null);
  }, []);

  useEffect(() => {
    if (!listenOutside || (hoveredIndex === null && pinnedIndex === null)) return;
    function onPointerDown(e: PointerEvent) {
      if (!containerRef.current?.contains(e.target as Node)) {
        dismiss();
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') dismiss();
    }
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [listenOutside, containerRef, hoveredIndex, pinnedIndex, dismiss]);

  const notePointerDown = useCallback((pointerType?: string) => {
    if (pointerType) pointerTypeRef.current = pointerType;
    pointerFocusedRef.current = true;
  }, []);

  const notePointerEnter = useCallback((pointerType?: string) => {
    if (pointerType) pointerTypeRef.current = pointerType;
  }, []);

  const isTouchPointer = useCallback(
    () => pointerTypeRef.current === 'touch',
    []
  );

  const hoverItem = useCallback((index: number) => {
    if (pointerTypeRef.current === 'touch') return;
    setPinnedIndex((prev) => (prev !== null && prev !== index ? null : prev));
    setHoveredIndex(index);
  }, []);

  const focusItem = useCallback((index: number) => {
    if (pointerFocusedRef.current) {
      pointerFocusedRef.current = false;
      return;
    }
    setHoveredIndex(index);
  }, []);

  const blurItem = useCallback((stillInside: boolean) => {
    pointerFocusedRef.current = false;
    if (!stillInside) {
      setHoveredIndex(null);
    }
  }, []);

  const leaveContainer = useCallback(() => {
    setHoveredIndex(null);
  }, []);

  const togglePin = useCallback((index: number) => {
    pointerFocusedRef.current = false;
    setPinnedIndex((prev) => {
      const next = prev === index ? null : index;
      if (next === null) {
        setHoveredIndex(null);
      }
      return next;
    });
  }, []);

  const pinItem = useCallback((index: number) => {
    pointerFocusedRef.current = false;
    setPinnedIndex(index);
  }, []);

  return {
    activeIndex,
    hoveredIndex,
    pinnedIndex,
    notePointerDown,
    notePointerEnter,
    isTouchPointer,
    hoverItem,
    focusItem,
    blurItem,
    leaveContainer,
    togglePin,
    pinItem,
    setHoveredIndex,
    dismiss,
  };
}
