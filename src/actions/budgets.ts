'use server';

import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { isUuid, parseBudgetItemInput } from '@/lib/validation';
import {
  ActionResult,
  invalidateLedgerCache,
  ownsRecord,
  requireCurrentUserId,
} from './shared';

const BUDGET_TARGET_TABLES = {
  INCOME: schema.categories,
  SPENDING: schema.budgetGroups,
  SAVINGS: schema.savingsFunds,
} as const;

export async function upsertBudgetItemAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const parsed = parseBudgetItemInput(formData);
  if (!parsed) {
    return { error: 'Please provide valid budget item details.' };
  }

  const owned = await ownsRecord(
    BUDGET_TARGET_TABLES[parsed.itemType],
    parsed.targetId,
    userId
  );
  if (!owned) {
    return { error: 'Selected budget target does not exist.' };
  }

  const categoryId = parsed.itemType === 'INCOME' ? parsed.targetId : null;
  const budgetGroupId = parsed.itemType === 'SPENDING' ? parsed.targetId : null;
  const savingsFundId = parsed.itemType === 'SAVINGS' ? parsed.targetId : null;

  await db
    .insert(schema.monthlyBudgetItems)
    .values({
      userId,
      budgetMonth: parsed.budgetMonth,
      itemType: parsed.itemType,
      categoryId,
      budgetGroupId,
      savingsFundId,
      plannedAmount: parsed.plannedAmount,
    })
    .onConflictDoUpdate({
      target: [
        schema.monthlyBudgetItems.userId,
        schema.monthlyBudgetItems.budgetMonth,
        schema.monthlyBudgetItems.itemType,
        schema.monthlyBudgetItems.categoryId,
        schema.monthlyBudgetItems.budgetGroupId,
        schema.monthlyBudgetItems.savingsFundId,
      ],
      set: {
        plannedAmount: parsed.plannedAmount,
        updatedAt: new Date(),
      },
    });

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function deleteBudgetItemAction(id: string): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  if (!id) return { error: 'Missing budget item ID.' };
  if (!isUuid(id)) return { error: 'Budget target not found.' };

  const deleted = await db
    .delete(schema.monthlyBudgetItems)
    .where(
      and(
        eq(schema.monthlyBudgetItems.id, id),
        eq(schema.monthlyBudgetItems.userId, userId)
      )
    )
    .returning({ id: schema.monthlyBudgetItems.id });

  if (deleted.length === 0) return { error: 'Budget target not found.' };

  invalidateLedgerCache(userId);
  return { ok: true };
}
