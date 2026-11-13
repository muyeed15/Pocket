'use client';

import React, { useEffect } from 'react';
import { IoClose } from 'react-icons/io5';
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
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-white/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-neutral-200 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:rounded-3xl sm:p-10"
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
