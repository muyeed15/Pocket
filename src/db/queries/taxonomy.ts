import { asc, eq } from 'drizzle-orm';
import { db } from '../index';
import * as schema from '../schema';
import type { BudgetGroupOption, CategoryOption, FlowType } from '@/types/ledger';

export async function getBudgetGroups(userId: string): Promise<BudgetGroupOption[]> {
  return db
    .select({ id: schema.budgetGroups.id, name: schema.budgetGroups.name })
    .from(schema.budgetGroups)
    .where(eq(schema.budgetGroups.userId, userId))
    .orderBy(asc(schema.budgetGroups.name));
}

export async function getCategories(
  userId: string,
  budgetGroups: BudgetGroupOption[]
): Promise<CategoryOption[]> {
  const catRows = await db
    .select({
      id: schema.categories.id,
      name: schema.categories.name,
      flowType: schema.categories.flowType,
      budgetGroupId: schema.categories.budgetGroupId,
      defaultSavingsFundId: schema.categories.defaultSavingsFundId,
    })
    .from(schema.categories)
    .where(eq(schema.categories.userId, userId))
    .orderBy(asc(schema.categories.name));

  const bgMap = new Map(budgetGroups.map((b) => [b.id, b.name]));

  return catRows.map((c) => ({
    id: c.id,
    name: c.name,
    flowType: c.flowType as FlowType,
    budgetGroupId: c.budgetGroupId,
    budgetGroupName: c.budgetGroupId ? (bgMap.get(c.budgetGroupId) ?? null) : null,
    defaultSavingsFundId: c.defaultSavingsFundId,
  }));
}
