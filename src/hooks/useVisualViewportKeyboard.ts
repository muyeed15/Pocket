'use client';

import { useEffect, useSyncExternalStore, type RefObject } from 'react';

export interface ViewportMetrics {
  keyboardInset: number;
  viewportHeight: number;
}

const SERVER_SNAPSHOT: ViewportMetrics = {
  keyboardInset: 0,
  viewportHeight: 0,
};

let currentSnapshot: ViewportMetrics = SERVER_SNAPSHOT;
const listeners = new Set<() => void>();
let attachedViewport: VisualViewport | null | undefined = null;

function readViewportMetrics(): ViewportMetrics {
  if (typeof window === 'undefined') return SERVER_SNAPSHOT;
  const vv = window.visualViewport;
  const viewportHeight = vv ? Math.round(vv.height) : window.innerHeight;
  const inset = vv
    ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
    : 0;
  // Ignore small mobile URL-bar chrome height deltas (< 80px).
  const keyboardInset = inset >= 80 ? inset : 0;
  return { keyboardInset, viewportHeight };
}

function notifyIfChanged() {
  const next = readViewportMetrics();
  if (
    next.keyboardInset !== currentSnapshot.keyboardInset ||
    next.viewportHeight !== currentSnapshot.viewportHeight
  ) {
    currentSnapshot = next;
    listeners.forEach((listener) => listener());
  }
}

function subscribe(listener: () => void) {
  if (typeof window !== 'undefined' && listeners.size === 0) {
    currentSnapshot = readViewportMetrics();
    attachedViewport = window.visualViewport;
    attachedViewport?.addEventListener('resize', notifyIfChanged);
    attachedViewport?.addEventListener('scroll', notifyIfChanged);
    window.addEventListener('resize', notifyIfChanged);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
    if (typeof window !== 'undefined' && listeners.size === 0) {
      attachedViewport?.removeEventListener('resize', notifyIfChanged);
      attachedViewport?.removeEventListener('scroll', notifyIfChanged);
      window.removeEventListener('resize', notifyIfChanged);
      attachedViewport = null;
    }
  };
}

function getSnapshot(): ViewportMetrics {
  return currentSnapshot;
}

function getServerSnapshot(): ViewportMetrics {
  return SERVER_SNAPSHOT;
}

/** Subscribes to Android/mobile visual viewport height and soft-keyboard inset. */
export function useVisualViewportMetrics(): ViewportMetrics {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

function isFormControl(el: Element | null): el is HTMLElement {
  if (!(el instanceof HTMLElement)) return false;
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT'
  );
}

/** Schedules a next-frame callback with a timer fallback for headless environments. */
export function scheduleFrame(cb: () => void): number {
  if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
    return window.requestAnimationFrame(cb);
  }
  return window.setTimeout(cb, 0);
}

/** Cancels a callback scheduled with `scheduleFrame`. */
export function cancelScheduledFrame(id: number): void {
  if (typeof window !== 'undefined' && typeof window.cancelAnimationFrame === 'function') {
    window.cancelAnimationFrame(id);
  } else {
    window.clearTimeout(id);
  }
}

/**
 * Keeps the active form field scrolled into the visible area above mobile soft keyboards
 * and below sticky headers across focus changes and delayed Android keyboard animations.
 */
export function useKeepFocusedFieldVisible(
  containerRef: RefObject<HTMLElement | null>,
  {
    enabled = true,
    topPadding = 16,
    bottomPadding = 20,
    ignoreInsideDialog = false,
  }: {
    enabled?: boolean;
    topPadding?: number;
    bottomPadding?: number;
    ignoreInsideDialog?: boolean;
  } = {}
) {
  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    let frameId = 0;
    let timerId = 0;

    function nudgeActiveControl() {
      const container = containerRef.current;
      const active = document.activeElement;
      if (!container || !isFormControl(active) || !container.contains(active)) {
        return;
      }
      if (ignoreInsideDialog && active.closest('[role="dialog"]')) return;

      const vv = window.visualViewport;
      const vpTop = vv ? vv.offsetTop : 0;
      const vpBottom = vv ? vv.offsetTop + vv.height : window.innerHeight;
      const containerRect = container.getBoundingClientRect();
      const safeTop = Math.max(vpTop + topPadding, containerRect.top + 8);
      const safeBottom = Math.min(
        vpBottom - bottomPadding,
        containerRect.bottom - 8
      );
      const rect = active.getBoundingClientRect();

      if (rect.height === 0 && rect.width === 0) return;
      if (rect.bottom > safeBottom || rect.top < safeTop) {
        active.scrollIntoView?.({ block: 'center', behavior: 'smooth' });
      }
    }

    function scheduleNudge() {
      cancelScheduledFrame(frameId);
      window.clearTimeout(timerId);
      frameId = scheduleFrame(nudgeActiveControl);
      // Android soft-keyboard animation finishes asynchronously after focusin.
      timerId = window.setTimeout(nudgeActiveControl, 250);
    }

    const container = containerRef.current;
    const vv = window.visualViewport;
    container?.addEventListener('focusin', scheduleNudge);
    vv?.addEventListener('resize', scheduleNudge);

    return () => {
      cancelScheduledFrame(frameId);
      window.clearTimeout(timerId);
      container?.removeEventListener('focusin', scheduleNudge);
      vv?.removeEventListener('resize', scheduleNudge);
    };
  }, [containerRef, enabled, topPadding, bottomPadding, ignoreInsideDialog]);
}
