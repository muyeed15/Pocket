'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import * as schema from '@/db/schema';
import {
  ActionResult,
  invalidateLedgerCache,
  requireDefaultUserId,
} from './shared';

export async function createTransferAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireDefaultUserId();
  const transferDate = String(formData.get('transferDate') || '').trim();
  const fromAccountId = String(formData.get('fromAccountId') || '').trim();
  const toAccountId = String(formData.get('toAccountId') || '').trim();
  const amountRaw = String(formData.get('amount') || '').trim();
  const feeAmountRaw = String(formData.get('feeAmount') || '0').trim();
  const descriptionRaw = String(formData.get('description') || '').trim();

  const amountNum = parseFloat(amountRaw);
  const feeNum = parseFloat(feeAmountRaw || '0');

  if (
    !transferDate ||
    !fromAccountId ||
    !toAccountId ||
    fromAccountId === toAccountId ||
    !Number.isFinite(amountNum) ||
    amountNum <= 0
  ) {
    return {
      error:
        'Please select two different accounts and enter a positive transfer amount.',
    };
  }

  await db.insert(schema.accountTransfers).values({
    userId,
    transferDate,
    fromAccountId,
    toAccountId,
    amount: amountNum.toFixed(2),
    feeAmount: Number.isFinite(feeNum) && feeNum >= 0 ? feeNum.toFixed(2) : '0.00',
    description: descriptionRaw || null,
  });

  invalidateLedgerCache();
  return { ok: true };
}

export async function deleteTransferAction(id: string): Promise<ActionResult> {
  if (!id) return { error: 'Missing transfer ID.' };
  await db
    .delete(schema.accountTransfers)
    .where(eq(schema.accountTransfers.id, id));
  invalidateLedgerCache();
  return { ok: true };
}
