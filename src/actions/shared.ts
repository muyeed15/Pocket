import { and, eq } from 'drizzle-orm';
import { updateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { isUuid } from '@/lib/validation';
import { getSessionUserId } from '@/lib/session';

export type ActionResult = { ok?: boolean; error?: string };

type OwnedTable =
  | typeof schema.accounts
  | typeof schema.budgetGroups
  | typeof schema.categories
  | typeof schema.savingsFunds;

export async function ownsRecord(
  table: OwnedTable,
  id: string,
  userId: string
): Promise<boolean> {
  if (!isUuid(id)) return false;
  const rows = await db
    .select({ id: table.id })
    .from(table)
    .where(and(eq(table.id, id), eq(table.userId, userId)))
    .limit(1);
  return rows.length > 0;
}

export async function requireCurrentUserId(): Promise<string> {
  const userId = await getSessionUserId();
  if (!userId) {
    redirect('/login');
  }
  return userId;
}

export function invalidateLedgerCache(userId: string): void {
  updateTag(`ledger:${userId}`);
}
