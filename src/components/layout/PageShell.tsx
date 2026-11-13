'use client';

import React, { useRef } from 'react';
import {
  useKeepFocusedFieldVisible,
  useVisualViewportMetrics,
} from '@/hooks/useVisualViewportKeyboard';
import { Toast, type ToastMessage } from '@/components/ui/Toast';

export function StickyHeader({
  className = '',
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/85 backdrop-blur-xl">
      <div className={`mx-auto max-w-6xl px-4 py-2.5 sm:px-6 sm:py-3.5 ${className}`}>
        {children}
      </div>
    </header>
  );
}

interface PageShellProps {
  header?: React.ReactNode;
  eyebrow?: string;
  title?: string;
  description?: string;
  centered?: boolean;
  toast?: ToastMessage | null;
  onDismissToast?: () => void;
  children: React.ReactNode;
}

/** Shared outer shell, header slot, responsive container rhythm, and toast layer. */
export function PageShell({
  header,
  eyebrow,
  title,
  description,
  centered = false,
  toast,
  onDismissToast,
  children,
}: PageShellProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const { keyboardInset, viewportHeight } = useVisualViewportMetrics();

  useKeepFocusedFieldVisible(shellRef, {
    topPadding: header ? 96 : 16,
    bottomPadding: 24,
    ignoreInsideDialog: true,
  });

  const titleHeader =
    eyebrow || title || description ? (
      <header className={centered ? 'space-y-2' : 'space-y-1.5'}>
        {eyebrow && <p className="text-2xl tracking-tight">{eyebrow}</p>}
        {title && <h1 className="text-3xl tracking-tight sm:text-4xl">{title}</h1>}
        {description && <p className="text-sm text-neutral-500">{description}</p>}
      </header>
    ) : null;

  return (
    <div
      ref={shellRef}
      style={keyboardInset > 0 ? { paddingBottom: keyboardInset } : undefined}
      className="min-h-screen bg-white text-black"
    >
      {header}

      {centered ? (
        <main
          style={
            keyboardInset > 0 && viewportHeight > 0
              ? { minHeight: `${viewportHeight}px` }
              : undefined
          }
          className="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 sm:py-16"
        >
          <div className="w-full max-w-sm space-y-8 sm:space-y-10">
            {titleHeader}
            {children}
          </div>
        </main>
      ) : (
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
          {titleHeader ? (
            <div className="space-y-10 sm:space-y-14">
              {titleHeader}
              {children}
            </div>
          ) : (
            children
          )}
        </main>
      )}

      {toast !== undefined && onDismissToast && (
        <Toast
          message={toast}
          bottomOffset={keyboardInset}
          onDismiss={onDismissToast}
        />
      )}
    </div>
  );
}
