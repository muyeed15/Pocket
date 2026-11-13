'use server';

import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { isUuid } from '@/lib/validation';
import {
  ActionResult,
  invalidateLedgerCache,
  requireCurrentUserId,
} from './shared';

export async function updateAccountOpeningBalanceAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const accountId = String(formData.get('accountId') || '').trim();
  const openingBalanceRaw = String(formData.get('openingBalance') || '0').trim();
  const openingNum = parseFloat(openingBalanceRaw);

  if (!accountId || !Number.isFinite(openingNum)) {
    return { error: 'Invalid account or opening balance.' };
  }
  if (!isUuid(accountId)) {
    return { error: 'Account not found.' };
  }

  const updated = await db
    .update(schema.accounts)
    .set({
      openingBalance: openingNum.toFixed(2),
      updatedAt: new Date(),
    })
    .where(
      and(eq(schema.accounts.id, accountId), eq(schema.accounts.userId, userId))
    )
    .returning({ id: schema.accounts.id });

  if (updated.length === 0) {
    return { error: 'Account not found.' };
  }

  invalidateLedgerCache(userId);
  return { ok: true };
}
