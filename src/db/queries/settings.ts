import { cacheLife, cacheTag } from 'next/cache';
import { sql } from 'drizzle-orm';
import { db } from '../index';
import { getCurrentUser, type AuthenticatedUser } from '@/lib/auth';
import { toNum } from '@/lib/format';
import type {
  AccountSettingRow,
  AccountType,
  BudgetGroupSettingRow,
  CategorySettingRow,
  FlowType,
  SavingsFundSettingRow,
  SettingsSnapshot,
} from '@/types/ledger';

async function getCachedSettingsSnapshot(
  userRow: AuthenticatedUser
): Promise<SettingsSnapshot> {
  'use cache';
  cacheTag(`ledger:${userRow.id}`);
  cacheLife('minutes');

  const [catRes, bgRes, sfRes, accRes] = await Promise.all([
    db.execute(sql`
      SELECT
        c.id,
        c.name,
        c.flow_type,
        c.budget_group_id,
        bg.name AS budget_group_name,
        c.default_savings_fund_id,
        sf.name AS default_savings_fund_name,
        (
          (SELECT COUNT(*)::int FROM transactions t WHERE t.category_id = c.id) +
          (SELECT COUNT(*)::int FROM monthly_budget_items b WHERE b.category_id = c.id)
        ) AS usage_count
      FROM categories c
      LEFT JOIN budget_groups bg ON bg.id = c.budget_group_id
      LEFT JOIN savings_funds sf ON sf.id = c.default_savings_fund_id
      WHERE c.user_id = ${userRow.id}
      ORDER BY c.flow_type ASC, c.name ASC
    `),
    db.execute(sql`
      SELECT
        bg.id,
        bg.name,
        bg.sort_order,
        (
          (SELECT COUNT(*)::int FROM categories c WHERE c.budget_group_id = bg.id) +
          (SELECT COUNT(*)::int FROM monthly_budget_items b WHERE b.budget_group_id = bg.id)
        ) AS usage_count
      FROM budget_groups bg
      WHERE bg.user_id = ${userRow.id}
      ORDER BY bg.sort_order ASC, bg.name ASC
    `),
    db.execute(sql`
      SELECT
        sf.id,
        sf.name,
        sf.opening_balance,
        sf.sort_order,
        (
          (SELECT COUNT(*)::int FROM transactions t WHERE t.savings_fund_id = sf.id) +
          (SELECT COUNT(*)::int FROM categories c WHERE c.default_savings_fund_id = sf.id) +
          (SELECT COUNT(*)::int FROM monthly_budget_items b WHERE b.savings_fund_id = sf.id)
        ) AS usage_count
      FROM savings_funds sf
      WHERE sf.user_id = ${userRow.id}
      ORDER BY sf.sort_order ASC, sf.name ASC
    `),
    db.execute(sql`
      SELECT
        a.id,
        a.name,
        a.type,
        a.opening_balance,
        a.sort_order,
        (
          (SELECT COUNT(*)::int FROM transactions t WHERE t.account_id = a.id) +
          (SELECT COUNT(*)::int FROM account_transfers tr WHERE tr.from_account_id = a.id OR tr.to_account_id = a.id)
        ) AS usage_count
      FROM accounts a
      WHERE a.user_id = ${userRow.id}
      ORDER BY a.sort_order ASC, a.name ASC
    `),
  ]);

  const categories: CategorySettingRow[] = (
    catRes.rows as Array<Record<string, unknown>>
  ).map((r) => ({
    id: String(r.id),
    name: String(r.name),
    flowType: String(r.flow_type) as FlowType,
    budgetGroupId: r.budget_group_id ? String(r.budget_group_id) : null,
    budgetGroupName: r.budget_group_name ? String(r.budget_group_name) : null,
    defaultSavingsFundId: r.default_savings_fund_id
      ? String(r.default_savings_fund_id)
      : null,
    defaultSavingsFundName: r.default_savings_fund_name
      ? String(r.default_savings_fund_name)
      : null,
    usageCount: Number(r.usage_count ?? 0),
  }));

  const budgetGroups: BudgetGroupSettingRow[] = (
    bgRes.rows as Array<Record<string, unknown>>
  ).map((r) => ({
    id: String(r.id),
    name: String(r.name),
    sortOrder: Number(r.sort_order ?? 0),
    usageCount: Number(r.usage_count ?? 0),
  }));

  const savingsFunds: SavingsFundSettingRow[] = (
    sfRes.rows as Array<Record<string, unknown>>
  ).map((r) => ({
    id: String(r.id),
    name: String(r.name),
    openingBalance: toNum(r.opening_balance as string),
    sortOrder: Number(r.sort_order ?? 0),
    usageCount: Number(r.usage_count ?? 0),
  }));

  const accounts: AccountSettingRow[] = (
    accRes.rows as Array<Record<string, unknown>>
  ).map((r) => ({
    id: String(r.id),
    name: String(r.name),
    type: String(r.type) as AccountType,
    openingBalance: toNum(r.opening_balance as string),
    sortOrder: Number(r.sort_order ?? 0),
    usageCount: Number(r.usage_count ?? 0),
  }));

  return {
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      currencyCode: userRow.currencyCode,
      currencySymbol: userRow.currencySymbol,
      openingCashBalance: toNum(userRow.openingCashBalance),
      openingSavingsBalance: toNum(userRow.openingSavingsBalance),
    },
    categories,
    budgetGroups,
    savingsFunds,
    accounts,
  };
}

export async function getSettingsSnapshot(): Promise<SettingsSnapshot> {
  const userRow = await getCurrentUser();
  return getCachedSettingsSnapshot(userRow);
}
