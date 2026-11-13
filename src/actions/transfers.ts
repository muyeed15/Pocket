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
        'Please select two different accounts and enter a positive transfer amount.',
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
