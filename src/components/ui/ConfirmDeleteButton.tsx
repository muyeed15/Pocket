'use client';

import React, { useState } from 'react';
import { IoTrashOutline } from 'react-icons/io5';
import { IconButton } from './Button';

/**
 * Reveals row action buttons cleanly on hover/focus on desktop while keeping clickable hitboxes intact
 * (zero layout shift on hover) and always visible on touch devices.
 */
export const ROW_ACTIONS_CLASS =
  'flex shrink-0 items-center justify-end gap-1 sm:min-w-[92px] sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100 sm:focus-within:opacity-100';

/**
 * Two-step inline delete control to prevent accidental single-tap permanent deletion on touch screens.
 * Resets back to the trash icon cleanly on blur or Escape.
 */
export function ConfirmDeleteButton({
  label,
  confirmLabel = 'Confirm delete',
  confirmText = 'Delete?',
  disabled = false,
  onConfirm,
}: {
  label: string;
  confirmLabel?: string;
  confirmText?: string;
  disabled?: boolean;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <IconButton
        label={label}
        disabled={disabled}
        onClick={() => setConfirming(true)}
      >
        <IoTrashOutline />
      </IconButton>
    );
  }

  return (
    <button
      type="button"
      autoFocus
      disabled={disabled}
      aria-label={confirmLabel}
      onClick={() => {
        setConfirming(false);
        onConfirm();
      }}
      onBlur={() => setConfirming(false)}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          setConfirming(false);
        }
      }}
      className="inline-flex h-8 w-[52px] shrink-0 items-center justify-center rounded-full bg-black text-xs text-white transition-colors hover:bg-neutral-800 disabled:opacity-40"
    >
      {confirmText}
    </button>
  );
}
