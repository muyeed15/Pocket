'use client';

import { useState, useTransition } from 'react';
import type { ActionResult } from '@/actions';
import type { ToastMessage } from '@/components/ui/Toast';

/** Shared transition + toast feedback handler for forms and mutations across views. */
export function useActionToast() {
  const [isPending, startTransition] = useTransition();
  const [toast, setToast] = useState<ToastMessage | null>(null);

  function runAction(
    action: () => Promise<ActionResult>,
    successText?: string,
    onSuccess?: () => void
  ) {
    setToast(null);
    startTransition(async () => {
      const res = await action();
      if (res?.error) {
        setToast({ type: 'error', text: res.error });
      } else {
        onSuccess?.();
        if (successText) {
          setToast({ type: 'success', text: successText });
        }
      }
    });
  }

  return {
    isPending,
    toast,
    dismissToast: () => setToast(null),
    runAction,
    startTransition,
  };
}
