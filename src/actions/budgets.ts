'use server';

import { eq } from 'drizzle-orm';
import { db } from '@/db';
import * as schema from '@/db/schema';
import type { BudgetItemType } from '@/types/ledger';
import {
  ActionResult,
  invalidateLedgerCache,
  requireDefaultUserId,
} from './shared';

export async function upsertBudgetItemAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireDefaultUserId();
  const budgetMonth = String(formData.get('budgetMonth') || '').trim();
  const itemType = String(
    formData.get('itemType') || ''
  ).trim() as BudgetItemType;
  const targetId = String(formData.get('targetId') || '').trim();
  const plannedAmountRaw = String(formData.get('plannedAmount') || '0').trim();
  const plannedNum = parseFloat(plannedAmountRaw);

  if (
    !budgetMonth ||
    !['INCOME', 'SPENDING', 'SAVINGS'].includes(itemType) ||
    !targetId ||
    !Number.isFinite(plannedNum) ||
    plannedNum < 0
  ) {
    return { error: 'Please provide valid budget item details.' };
  }

  const categoryId = itemType === 'INCOME' ? targetId : null;
  const budgetGroupId = itemType === 'SPENDING' ? targetId : null;
  const savingsFundId = itemType === 'SAVINGS' ? targetId : null;

  await db
    .insert(schema.monthlyBudgetItems)
    .values({
      userId,
      budgetMonth,
      itemType,
      categoryId,
      budgetGroupId,
      savingsFundId,
      plannedAmount: plannedNum.toFixed(2),
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
        plannedAmount: plannedNum.toFixed(2),
        updatedAt: new Date(),
      },
    });

  invalidateLedgerCache();
  return { ok: true };
}

export async function deleteBudgetItemAction(id: string): Promise<ActionResult> {
  if (!id) return { error: 'Missing budget item ID.' };
  await db
    .delete(schema.monthlyBudgetItems)
    .where(eq(schema.monthlyBudgetItems.id, id));
  invalidateLedgerCache();
  return { ok: true };
}
