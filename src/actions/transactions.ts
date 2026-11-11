'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import * as schema from '@/db/schema';
import {
  ActionResult,
  invalidateLedgerCache,
  requireDefaultUserId,
} from './shared';

export async function createTransactionAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireDefaultUserId();
  const transactionDate = String(formData.get('transactionDate') || '').trim();
  const categoryId = String(formData.get('categoryId') || '').trim();
  const accountIdRaw = String(formData.get('accountId') || '').trim();
  const savingsFundIdRaw = String(formData.get('savingsFundId') || '').trim();
  const amountRaw = String(formData.get('amount') || '').trim();
  const descriptionRaw = String(formData.get('description') || '').trim();

  const amountNum = parseFloat(amountRaw);
  if (
    !transactionDate ||
    !categoryId ||
    !Number.isFinite(amountNum) ||
    amountNum <= 0
  ) {
    return {
      error: 'Please provide a valid date, category, and positive amount.',
    };
  }

  await db.insert(schema.transactions).values({
    userId,
    transactionDate,
    categoryId,
    accountId: accountIdRaw || null,
    savingsFundId: savingsFundIdRaw || null,
    amount: amountNum.toFixed(2),
    description: descriptionRaw || null,
  });

  invalidateLedgerCache();
  return { ok: true };
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  if (!id) return { error: 'Missing transaction ID.' };
  await db.delete(schema.transactions).where(eq(schema.transactions.id, id));
  invalidateLedgerCache();
  return { ok: true };
}
