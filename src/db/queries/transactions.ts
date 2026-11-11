import { sql } from 'drizzle-orm';
import { db } from '../index';
import { toNum } from '@/lib/format';
import type { FlowType, LedgerTransactionRow } from '@/types/ledger';

export async function getTransactionsByUser(
  userId: string
): Promise<LedgerTransactionRow[]> {
  const txResult = await db.execute(sql`
    SELECT
      id,
      entry_sequence,
      TO_CHAR(transaction_date, 'YYYY-MM-DD') AS transaction_date,
      description,
      amount,
      legacy_category,
      category_id,
      category_name,
      flow_type,
      budget_group_id,
      budget_group_name,
      savings_fund_id,
      savings_fund_name,
      account_id,
      account_name,
      cash_change,
      running_cash_balance,
      savings_change,
      running_savings_balance
    FROM v_transaction_ledger
    WHERE user_id = ${userId}
    ORDER BY transaction_date DESC, entry_sequence DESC
  `);

  return (txResult.rows as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    entrySequence: Number(r.entry_sequence),
    transactionDate: String(r.transaction_date),
    description: r.description ? String(r.description) : null,
    amount: toNum(r.amount as string),
    legacyCategory: r.legacy_category ? String(r.legacy_category) : null,
    categoryId: String(r.category_id),
    categoryName: String(r.category_name),
    flowType: String(r.flow_type) as FlowType,
    budgetGroupId: r.budget_group_id ? String(r.budget_group_id) : null,
    budgetGroupName: String(r.budget_group_name),
    savingsFundId: r.savings_fund_id ? String(r.savings_fund_id) : null,
    savingsFundName: r.savings_fund_name ? String(r.savings_fund_name) : null,
    accountId: r.account_id ? String(r.account_id) : null,
    accountName: r.account_name ? String(r.account_name) : null,
    cashChange: toNum(r.cash_change as string),
    runningCashBalance: toNum(r.running_cash_balance as string),
    savingsChange: toNum(r.savings_change as string),
    runningSavingsBalance: toNum(r.running_savings_balance as string),
  }));
}
