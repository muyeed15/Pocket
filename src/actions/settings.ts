'use server';

import { and, eq, or, sql } from 'drizzle-orm';
import { db } from '@/db';
import * as schema from '@/db/schema';
import type { AccountType, FlowType } from '@/types/ledger';
import {
  ActionResult,
  invalidateLedgerCache,
  requireCurrentUserId,
} from './shared';

const VALID_FLOW_TYPES: FlowType[] = [
  'INCOME',
  'EXPENSE',
  'BORROWING',
  'DEBT_PAYMENT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'UNTRACKED_IN',
  'UNTRACKED_OUT',
  'SAVINGS_DEPOSIT',
  'SAVINGS_WITHDRAWAL',
];

const VALID_ACCOUNT_TYPES: AccountType[] = ['CASH', 'BANK', 'MFS'];

export async function updatePreferencesAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const currencyCode = String(formData.get('currencyCode') || '')
    .trim()
    .toUpperCase();
  const currencySymbol = String(formData.get('currencySymbol') || '').trim();
  const openingCash = parseFloat(
    String(formData.get('openingCashBalance') || '0').trim()
  );
  const openingSavings = parseFloat(
    String(formData.get('openingSavingsBalance') || '0').trim()
  );

  if (currencyCode.length !== 3 || !currencySymbol) {
    return { error: 'Please provide a 3-letter currency code and symbol.' };
  }
  if (!Number.isFinite(openingCash) || !Number.isFinite(openingSavings)) {
    return { error: 'Opening balances must be valid numbers.' };
  }

  await db
    .update(schema.users)
    .set({
      currencyCode,
      currencySymbol,
      openingCashBalance: openingCash.toFixed(2),
      openingSavingsBalance: openingSavings.toFixed(2),
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId));

  invalidateLedgerCache(userId);
  return { ok: true };
}

function parseCategoryInput(formData: FormData) {
  const name = String(formData.get('name') || '').trim();
  const flowType = String(formData.get('flowType') || '').trim() as FlowType;
  const budgetGroupIdRaw = String(formData.get('budgetGroupId') || '').trim();
  const defaultSavingsFundIdRaw = String(
    formData.get('defaultSavingsFundId') || ''
  ).trim();

  if (!name || !VALID_FLOW_TYPES.includes(flowType)) {
    return null;
  }

  return {
    name,
    flowType,
    budgetGroupId: flowType === 'EXPENSE' && budgetGroupIdRaw ? budgetGroupIdRaw : null,
    defaultSavingsFundId:
      (flowType === 'SAVINGS_DEPOSIT' || flowType === 'SAVINGS_WITHDRAWAL') &&
      defaultSavingsFundIdRaw
        ? defaultSavingsFundIdRaw
        : null,
  };
}

export async function createCategoryAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const parsed = parseCategoryInput(formData);
  if (!parsed) {
    return { error: 'Please provide a category name and flow type.' };
  }

  try {
    await db.insert(schema.categories).values({
      userId,
      ...parsed,
    });
  } catch {
    return { error: 'A category with this name already exists.' };
  }

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function updateCategoryAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const id = String(formData.get('id') || '').trim();
  if (!id) return { error: 'Missing category ID.' };

  const parsed = parseCategoryInput(formData);
  if (!parsed) {
    return { error: 'Please provide a category name and flow type.' };
  }

  try {
    await db
      .update(schema.categories)
      .set(parsed)
      .where(
        and(eq(schema.categories.id, id), eq(schema.categories.userId, userId))
      );
  } catch {
    return { error: 'A category with this name already exists.' };
  }

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function deleteCategoryAction(id: string): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  if (!id) return { error: 'Missing category ID.' };

  const [{ count: txCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.categoryId, id),
        eq(schema.transactions.userId, userId)
      )
    );

  const [{ count: budgetCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.monthlyBudgetItems)
    .where(
      and(
        eq(schema.monthlyBudgetItems.categoryId, id),
        eq(schema.monthlyBudgetItems.userId, userId)
      )
    );

  if (txCount > 0 || budgetCount > 0) {
    return { error: 'This category is in use and cannot be deleted.' };
  }

  await db
    .delete(schema.categories)
    .where(
      and(eq(schema.categories.id, id), eq(schema.categories.userId, userId))
    );

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function createBudgetGroupAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const name = String(formData.get('name') || '').trim();
  if (!name) return { error: 'Please enter a budget group name.' };

  try {
    await db.insert(schema.budgetGroups).values({ userId, name });
  } catch {
    return { error: 'A budget group with this name already exists.' };
  }

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function updateBudgetGroupAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const id = String(formData.get('id') || '').trim();
  const name = String(formData.get('name') || '').trim();
  if (!id || !name) return { error: 'Please enter a budget group name.' };

  try {
    await db
      .update(schema.budgetGroups)
      .set({ name })
      .where(
        and(eq(schema.budgetGroups.id, id), eq(schema.budgetGroups.userId, userId))
      );
  } catch {
    return { error: 'A budget group with this name already exists.' };
  }

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function deleteBudgetGroupAction(id: string): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  if (!id) return { error: 'Missing budget group ID.' };

  const [{ count: catCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.categories)
    .where(
      and(
        eq(schema.categories.budgetGroupId, id),
        eq(schema.categories.userId, userId)
      )
    );

  const [{ count: budgetCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.monthlyBudgetItems)
    .where(
      and(
        eq(schema.monthlyBudgetItems.budgetGroupId, id),
        eq(schema.monthlyBudgetItems.userId, userId)
      )
    );

  if (catCount > 0 || budgetCount > 0) {
    return { error: 'This budget group is in use and cannot be deleted.' };
  }

  await db
    .delete(schema.budgetGroups)
    .where(
      and(eq(schema.budgetGroups.id, id), eq(schema.budgetGroups.userId, userId))
    );

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function createSavingsFundAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const name = String(formData.get('name') || '').trim();
  const openingNum = parseFloat(
    String(formData.get('openingBalance') || '0').trim()
  );

  if (!name || !Number.isFinite(openingNum)) {
    return { error: 'Please enter a fund name and valid opening balance.' };
  }

  try {
    await db.insert(schema.savingsFunds).values({
      userId,
      name,
      openingBalance: openingNum.toFixed(2),
    });
  } catch {
    return { error: 'A savings fund with this name already exists.' };
  }

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function updateSavingsFundAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const id = String(formData.get('id') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const openingNum = parseFloat(
    String(formData.get('openingBalance') || '0').trim()
  );

  if (!id || !name || !Number.isFinite(openingNum)) {
    return { error: 'Please enter a fund name and valid opening balance.' };
  }

  try {
    await db
      .update(schema.savingsFunds)
      .set({
        name,
        openingBalance: openingNum.toFixed(2),
        updatedAt: new Date(),
      })
      .where(
        and(eq(schema.savingsFunds.id, id), eq(schema.savingsFunds.userId, userId))
      );
  } catch {
    return { error: 'A savings fund with this name already exists.' };
  }

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function deleteSavingsFundAction(id: string): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  if (!id) return { error: 'Missing savings fund ID.' };

  const [{ count: txCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.transactions)
    .where(
      and(
        eq(schema.transactions.savingsFundId, id),
        eq(schema.transactions.userId, userId)
      )
    );

  const [{ count: catCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.categories)
    .where(
      and(
        eq(schema.categories.defaultSavingsFundId, id),
        eq(schema.categories.userId, userId)
      )
    );

  const [{ count: budgetCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.monthlyBudgetItems)
    .where(
      and(
        eq(schema.monthlyBudgetItems.savingsFundId, id),
        eq(schema.monthlyBudgetItems.userId, userId)
      )
    );

  if (txCount > 0 || catCount > 0 || budgetCount > 0) {
    return { error: 'This savings fund is in use and cannot be deleted.' };
  }

  await db
    .delete(schema.savingsFunds)
    .where(
      and(eq(schema.savingsFunds.id, id), eq(schema.savingsFunds.userId, userId))
    );

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function createAccountAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const name = String(formData.get('name') || '').trim();
  const type = String(formData.get('type') || '').trim() as AccountType;
  const openingNum = parseFloat(
    String(formData.get('openingBalance') || '0').trim()
  );

  if (!name || !VALID_ACCOUNT_TYPES.includes(type) || !Number.isFinite(openingNum)) {
    return { error: 'Please provide an account name, type, and opening balance.' };
  }

  try {
    await db.insert(schema.accounts).values({
      userId,
      name,
      type,
      openingBalance: openingNum.toFixed(2),
    });
  } catch {
    return { error: 'An account with this name already exists.' };
  }

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function updateAccountAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const id = String(formData.get('id') || '').trim();
  const name = String(formData.get('name') || '').trim();
  const type = String(formData.get('type') || '').trim() as AccountType;
  const openingNum = parseFloat(
    String(formData.get('openingBalance') || '0').trim()
  );

  if (!id || !name || !VALID_ACCOUNT_TYPES.includes(type) || !Number.isFinite(openingNum)) {
    return { error: 'Please provide an account name, type, and opening balance.' };
  }

  try {
    await db
      .update(schema.accounts)
      .set({
        name,
        type,
        openingBalance: openingNum.toFixed(2),
        updatedAt: new Date(),
      })
      .where(and(eq(schema.accounts.id, id), eq(schema.accounts.userId, userId)));
  } catch {
    return { error: 'An account with this name already exists.' };
  }

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function deleteAccountAction(id: string): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  if (!id) return { error: 'Missing account ID.' };

  const [{ count: txCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.transactions)
    .where(
      and(eq(schema.transactions.accountId, id), eq(schema.transactions.userId, userId))
    );

  const [{ count: trCount }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.accountTransfers)
    .where(
      and(
        eq(schema.accountTransfers.userId, userId),
        or(
          eq(schema.accountTransfers.fromAccountId, id),
          eq(schema.accountTransfers.toAccountId, id)
        )
      )
    );

  if (txCount > 0 || trCount > 0) {
    return { error: 'This account is in use and cannot be deleted.' };
  }

  await db
    .delete(schema.accounts)
    .where(and(eq(schema.accounts.id, id), eq(schema.accounts.userId, userId)));

  invalidateLedgerCache(userId);
  return { ok: true };
}
