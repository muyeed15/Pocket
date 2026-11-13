'use server';

import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { isUuid, parseTransferInput } from '@/lib/validation';
import {
  ActionResult,
  invalidateLedgerCache,
  ownsRecord,
  requireCurrentUserId,
} from './shared';

export async function createTransferAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const parsed = parseTransferInput(formData);

  if (!parsed) {
    return {
      error:
        'Please select two different accounts, enter a positive transfer amount, and use a non-negative service charge.',
    };
  }

  const [fromOwned, toOwned] = await Promise.all([
    ownsRecord(schema.accounts, parsed.fromAccountId, userId),
    ownsRecord(schema.accounts, parsed.toAccountId, userId),
  ]);
  if (!fromOwned || !toOwned) {
    return { error: 'Selected account does not exist.' };
  }

  await db.insert(schema.accountTransfers).values({
    userId,
    ...parsed,
  });

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function updateTransferAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const id = String(formData.get('id') || '').trim();
  if (!id) return { error: 'Missing transfer ID.' };
  if (!isUuid(id)) return { error: 'Transfer not found.' };

  const parsed = parseTransferInput(formData);
  if (!parsed) {
    return {
      error:
        'Please select two different accounts, enter a positive transfer amount, and use a non-negative service charge.',
    };
  }

  const [fromOwned, toOwned] = await Promise.all([
    ownsRecord(schema.accounts, parsed.fromAccountId, userId),
    ownsRecord(schema.accounts, parsed.toAccountId, userId),
  ]);
  if (!fromOwned || !toOwned) {
    return { error: 'Selected account does not exist.' };
  }

  const updated = await db
    .update(schema.accountTransfers)
    .set({
      ...parsed,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.accountTransfers.id, id),
        eq(schema.accountTransfers.userId, userId)
      )
    )
    .returning({ id: schema.accountTransfers.id });

  if (updated.length === 0) return { error: 'Transfer not found.' };

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function deleteTransferAction(id: string): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  if (!id) return { error: 'Missing transfer ID.' };
  if (!isUuid(id)) return { error: 'Transfer not found.' };

  const deleted = await db
    .delete(schema.accountTransfers)
    .where(
      and(
        eq(schema.accountTransfers.id, id),
        eq(schema.accountTransfers.userId, userId)
      )
    )
    .returning({ id: schema.accountTransfers.id });

  if (deleted.length === 0) return { error: 'Transfer not found.' };

  invalidateLedgerCache(userId);
  return { ok: true };
}
