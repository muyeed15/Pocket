'use client';

import React, { useEffect } from 'react';
import { IoClose } from 'react-icons/io5';

export interface ToastMessage {
  type: 'success' | 'error';
  text: string;
}

export function Toast({
  message,
  onDismiss,
}: {
  message: ToastMessage | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!message || message.type === 'error') return;
    const timer = setTimeout(onDismiss, 2800);
    return () => clearTimeout(timer);
  }, [message, onDismiss]);

  if (!message) return null;

  return (
    <div className="fixed inset-x-0 bottom-8 z-50 flex justify-center px-6">
      <div
        role="status"
        className={`flex items-center gap-4 rounded-full py-2.5 pl-6 pr-2.5 text-[15px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] ${
          message.type === 'error'
            ? 'border border-black bg-white text-black'
            : 'bg-black text-white'
        }`}
      >
        {message.text}
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="inline-flex size-7 items-center justify-center rounded-full opacity-60 hover:opacity-100"
        >
          <IoClose />
        </button>
      </div>
    </div>
  );
}
