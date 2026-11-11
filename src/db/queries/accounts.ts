import { sql } from 'drizzle-orm';
import { db } from '../index';
import { toNum } from '@/lib/format';
import type {
  AccountBalanceRow,
  AccountType,
  SavingsFundBalanceRow,
  TransferRow,
} from '@/types/ledger';

export async function getAccountBalances(
  userId: string
): Promise<AccountBalanceRow[]> {
  const accResult = await db.execute(sql`
    SELECT
      account_id,
      account_name,
      account_type,
      sort_order,
      opening_balance,
      money_in,
      money_out,
      current_balance
    FROM v_account_balances
    WHERE user_id = ${userId}
    ORDER BY sort_order ASC, account_name ASC
  `);

  return (accResult.rows as Array<Record<string, unknown>>).map((r) => ({
    accountId: String(r.account_id),
    accountName: String(r.account_name),
    accountType: String(r.account_type) as AccountType,
    sortOrder: Number(r.sort_order),
    openingBalance: toNum(r.opening_balance as string),
    moneyIn: toNum(r.money_in as string),
    moneyOut: toNum(r.money_out as string),
    currentBalance: toNum(r.current_balance as string),
  }));
}

export async function getSavingsFundBalances(
  userId: string
): Promise<SavingsFundBalanceRow[]> {
  const sfResult = await db.execute(sql`
    SELECT
      savings_fund_id,
      savings_fund_name,
      sort_order,
      opening_balance,
      total_deposits,
      total_withdrawals,
      current_balance
    FROM v_savings_fund_balances
    WHERE user_id = ${userId}
    ORDER BY sort_order ASC, savings_fund_name ASC
  `);

  return (sfResult.rows as Array<Record<string, unknown>>).map((r) => ({
    savingsFundId: String(r.savings_fund_id),
    savingsFundName: String(r.savings_fund_name),
    sortOrder: Number(r.sort_order),
    openingBalance: toNum(r.opening_balance as string),
    totalDeposits: toNum(r.total_deposits as string),
    totalWithdrawals: toNum(r.total_withdrawals as string),
    currentBalance: toNum(r.current_balance as string),
  }));
}

export async function getAccountTransfers(userId: string): Promise<TransferRow[]> {
  const transferResult = await db.execute(sql`
    SELECT
      t.id,
      TO_CHAR(t.transfer_date, 'YYYY-MM-DD') AS transfer_date,
      t.from_account_id,
      fa.name AS from_account_name,
      t.to_account_id,
      ta.name AS to_account_name,
      t.amount,
      t.fee_amount,
      t.description
    FROM account_transfers t
    JOIN accounts fa ON fa.id = t.from_account_id
    JOIN accounts ta ON ta.id = t.to_account_id
    WHERE t.user_id = ${userId}
    ORDER BY t.transfer_date DESC, t.created_at DESC
  `);

  return (transferResult.rows as Array<Record<string, unknown>>).map((r) => ({
    id: String(r.id),
    transferDate: String(r.transfer_date),
    fromAccountId: String(r.from_account_id),
    fromAccountName: String(r.from_account_name),
    toAccountId: String(r.to_account_id),
    toAccountName: String(r.to_account_name),
    amount: toNum(r.amount as string),
    feeAmount: toNum(r.fee_amount as string),
    description: r.description ? String(r.description) : null,
  }));
}
