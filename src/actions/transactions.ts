'use server';

import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import * as schema from '@/db/schema';
import {
  isUuid,
  parseTransactionInput,
  type ParsedTransactionInput,
} from '@/lib/validation';
import {
  ActionResult,
  invalidateLedgerCache,
  ownsRecord,
  requireCurrentUserId,
} from './shared';

async function verifyTransactionOwnership(
  userId: string,
  parsed: ParsedTransactionInput
): Promise<string | null> {
  const [catOwned, accOwned, sfOwned] = await Promise.all([
    ownsRecord(schema.categories, parsed.categoryId, userId),
    ownsRecord(schema.accounts, parsed.accountId, userId),
    parsed.savingsFundId
      ? ownsRecord(schema.savingsFunds, parsed.savingsFundId, userId)
      : Promise.resolve(true),
  ]);

  if (!catOwned) return 'Selected category does not exist.';
  if (!accOwned) return 'Selected account does not exist.';
  if (!sfOwned) return 'Selected savings fund does not exist.';
  return null;
}

export async function createTransactionAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const parsed = parseTransactionInput(formData);
  if (!parsed) {
    return {
      error:
        'Please provide a valid date, category, account, and positive amount.',
    };
  }

  const refError = await verifyTransactionOwnership(userId, parsed);
  if (refError) return { error: refError };

  await db.insert(schema.transactions).values({
    userId,
    ...parsed,
  });

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function updateTransactionAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const id = String(formData.get('id') || '').trim();
  if (!id) return { error: 'Missing transaction ID.' };
  if (!isUuid(id)) return { error: 'Transaction not found.' };

  const parsed = parseTransactionInput(formData);
  if (!parsed) {
    return {
      error:
        'Please provide a valid date, category, account, and positive amount.',
    };
  }

  const refError = await verifyTransactionOwnership(userId, parsed);
  if (refError) return { error: refError };

  const updated = await db
    .update(schema.transactions)
    .set({
      ...parsed,
      updatedAt: new Date(),
    })
    .where(
      and(eq(schema.transactions.id, id), eq(schema.transactions.userId, userId))
    )
    .returning({ id: schema.transactions.id });

  if (updated.length === 0) return { error: 'Transaction not found.' };

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function deleteTransactionAction(id: string): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  if (!id) return { error: 'Missing transaction ID.' };
  if (!isUuid(id)) return { error: 'Transaction not found.' };

  const deleted = await db
    .delete(schema.transactions)
    .where(
      and(eq(schema.transactions.id, id), eq(schema.transactions.userId, userId))
    )
    .returning({ id: schema.transactions.id });

  if (deleted.length === 0) return { error: 'Transaction not found.' };

  invalidateLedgerCache(userId);
  return { ok: true };
}
