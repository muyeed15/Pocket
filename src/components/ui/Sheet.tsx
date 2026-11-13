'use client';

import React, { useEffect, useRef } from 'react';
import { IoClose } from 'react-icons/io5';
import {
  useKeepFocusedFieldVisible,
  useVisualViewportMetrics,
} from '@/hooks/useVisualViewportKeyboard';
import { IconButton } from './Button';

export function Sheet({
  title,
  open,
  onClose,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const { keyboardInset, viewportHeight } = useVisualViewportMetrics();

  useKeepFocusedFieldVisible(dialogRef, {
    enabled: open,
    topPadding: 12,
    bottomPadding: 20,
  });

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const dialogMaxHeight =
    viewportHeight > 0
      ? keyboardInset > 0
        ? `${Math.max(240, viewportHeight - 16)}px`
        : `${Math.max(240, Math.min(Math.floor(viewportHeight * 0.9), viewportHeight - 16))}px`
      : undefined;

  return (
    <div
      style={keyboardInset > 0 ? { paddingBottom: keyboardInset } : undefined}
      className="fixed inset-0 z-50 flex items-end justify-center bg-white/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={dialogMaxHeight ? { maxHeight: dialogMaxHeight } : undefined}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-3xl border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:rounded-3xl sm:p-10"
      >
        <div className="mb-6 flex items-center justify-between sm:mb-8">
          <h2 className="text-2xl tracking-tight sm:text-3xl">{title}</h2>
          <IconButton label="Close" onClick={onClose}>
            <IoClose />
          </IconButton>
        </div>
        {children}
      </div>
    </div>
  );
}
