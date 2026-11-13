import { cacheLife, cacheTag } from 'next/cache';
import { getCurrentUser, type AuthenticatedUser } from '@/lib/auth';
import { getMonthPrefix, toNum } from '@/lib/format';
import {
  buildMonthInsights,
  buildYearlyMonthlySummary,
  computeReconciliation,
} from '@/lib/summary';
import type { LedgerSnapshot } from '@/types/ledger';
import { getTransactionsByUser } from './transactions';
import {
  getAccountBalances,
  getAccountTransfers,
  getSavingsFundBalances,
} from './accounts';
import { getBudgetGroups, getCategories } from './taxonomy';
import { getMonthlyBudgetProgress, getYearBudgetTotals } from './budgets';

async function getCachedLedgerSnapshot(
  userRow: AuthenticatedUser,
  selectedYear: number,
  selectedMonth: number
): Promise<LedgerSnapshot> {
  'use cache';
  cacheTag(`ledger:${userRow.id}`);
  cacheLife('minutes');

  const budgetMonthStr = `${getMonthPrefix(selectedYear, selectedMonth)}-01`;

  const [
    transactions,
    accounts,
    savingsFunds,
    budgetGroups,
    budgetItems,
    transfers,
    plannedByMonth,
  ] = await Promise.all([
    getTransactionsByUser(userRow.id),
    getAccountBalances(userRow.id),
    getSavingsFundBalances(userRow.id),
    getBudgetGroups(userRow.id),
    getMonthlyBudgetProgress(userRow.id, budgetMonthStr),
    getAccountTransfers(userRow.id),
    getYearBudgetTotals(userRow.id, selectedYear),
  ]);

  const categories = await getCategories(userRow.id, budgetGroups);
  const openingCash = toNum(userRow.openingCashBalance);
  const openingSavings = toNum(userRow.openingSavingsBalance);

  const monthlySummary = buildYearlyMonthlySummary({
    selectedYear,
    openingCash,
    openingSavings,
    transactionsDesc: transactions,
    transfers,
    plannedByMonth,
  });

  const reconciliation = computeReconciliation({
    accounts,
    transactionsDesc: transactions,
    transfers,
    openingCash,
  });

  const insights = buildMonthInsights({
    selectedYear,
    selectedMonth,
    openingCash,
    transactionsDesc: transactions,
    transfers,
  });

  return {
    selectedYear,
    selectedMonth,
    insights,
    user: {
      id: userRow.id,
      name: userRow.name,
      email: userRow.email,
      currencySymbol: userRow.currencySymbol,
      openingCashBalance: openingCash,
      openingSavingsBalance: openingSavings,
    },
    accounts,
    savingsFunds,
    budgetGroups,
    categories,
    transactions,
    transfers,
    budgetItems,
    monthlySummary,
    reconciliation,
  };
}

export async function getLedgerSnapshot(
  selectedYear: number,
  selectedMonth: number
): Promise<LedgerSnapshot> {
  const userRow = await getCurrentUser();
  return getCachedLedgerSnapshot(userRow, selectedYear, selectedMonth);
}
