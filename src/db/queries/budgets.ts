import { sql } from 'drizzle-orm';
import { db } from '../index';
import { toNum } from '@/lib/format';
import type { PlannedMonthTotals } from '@/lib/summary';
import type { BudgetItemType, BudgetProgressRow } from '@/types/ledger';

export async function getMonthlyBudgetProgress(
  userId: string,
  budgetMonthStr: string
): Promise<BudgetProgressRow[]> {
  const budgetResult = await db.execute(sql`
    SELECT
      p.id,
      TO_CHAR(p.budget_month, 'YYYY-MM-DD') AS budget_month,
      p.item_type,
      COALESCE(b.category_id, b.budget_group_id, b.savings_fund_id) AS target_id,
      p.target_name,
      p.planned_amount,
      p.actual_amount,
      p.remaining_amount,
      p.used_percentage
    FROM v_monthly_budget_progress p
    JOIN monthly_budget_items b ON b.id = p.id
    WHERE p.user_id = ${userId}
      AND p.budget_month = ${budgetMonthStr}::date
    ORDER BY p.item_type ASC, p.target_name ASC
  `);

  return (budgetResult.rows as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    budgetMonth: String(r.budget_month),
    itemType: String(r.item_type) as BudgetItemType,
    targetId: String(r.target_id),
    targetName: String(r.target_name),
    plannedAmount: toNum(r.planned_amount as string),
    actualAmount: toNum(r.actual_amount as string),
    remainingAmount: toNum(r.remaining_amount as string),
    usedPercentage:
      r.used_percentage !== null && r.used_percentage !== undefined
        ? toNum(r.used_percentage as string)
        : null,
  }));
}

export async function getYearBudgetTotals(
  userId: string,
  selectedYear: number
): Promise<Map<number, PlannedMonthTotals>> {
  const result = await db.execute(sql`
    SELECT
      EXTRACT(MONTH FROM budget_month)::int AS month_num,
      item_type,
      SUM(planned_amount) AS total_planned
    FROM monthly_budget_items
    WHERE user_id = ${userId}
      AND EXTRACT(YEAR FROM budget_month)::int = ${selectedYear}
    GROUP BY EXTRACT(MONTH FROM budget_month)::int, item_type
  `);

  const plannedByMonth = new Map<number, PlannedMonthTotals>();
  for (const row of result.rows as Array<Record<string, unknown>>) {
    const m = Number(row.month_num);
    const entry = plannedByMonth.get(m) ?? { income: 0, spending: 0, savings: 0 };
    const total = toNum(row.total_planned as string);
    if (row.item_type === 'INCOME') entry.income = total;
    else if (row.item_type === 'SPENDING') entry.spending = total;
    else if (row.item_type === 'SAVINGS') entry.savings = total;
    plannedByMonth.set(m, entry);
  }
  return plannedByMonth;
}
