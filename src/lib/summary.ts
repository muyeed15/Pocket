import { MONTH_NAMES } from './constants';
import { getMonthPrefix, round2 } from './format';
import type {
  AccountBalanceRow,
  LedgerTransactionRow,
  MonthInsights,
  MonthlySummaryRow,
  ReconciliationSummary,
} from '@/types/ledger';

export interface PlannedMonthTotals {
  income: number;
  spending: number;
  savings: number;
}

export function buildYearlyMonthlySummary(params: {
  selectedYear: number;
  openingCash: number;
  openingSavings: number;
  transactionsDesc: LedgerTransactionRow[];
  plannedByMonth: Map<number, PlannedMonthTotals>;
}): MonthlySummaryRow[] {
  const { selectedYear, openingCash, openingSavings, transactionsDesc, plannedByMonth } =
    params;
  const chronologicalTx = [...transactionsDesc].reverse();

  return MONTH_NAMES.map((monthName, idx) => {
    const monthIndex = idx + 1;
    const monthPrefix = getMonthPrefix(selectedYear, monthIndex);
    const nextMonthDate =
      monthIndex === 12
        ? `${selectedYear + 1}-01-01`
        : `${getMonthPrefix(selectedYear, monthIndex + 1)}-01`;

    let income = 0;
    let spending = 0;
    let borrowed = 0;
    let debtPaid = 0;
    let transfersNet = 0;
    let untrackedNet = 0;
    let saved = 0;
    let savingsUsed = 0;
    let cumCash = openingCash;
    let cumSavings = openingSavings;
    let hasEntriesUpToMonth = false;

    for (const tx of chronologicalTx) {
      if (tx.transactionDate < nextMonthDate) {
        hasEntriesUpToMonth = true;
        cumCash += tx.cashChange;
        cumSavings += tx.savingsChange;
      }
      if (!tx.transactionDate.startsWith(monthPrefix)) continue;

      switch (tx.flowType) {
        case 'INCOME':
          income += tx.amount;
          break;
        case 'EXPENSE':
          spending += tx.amount;
          break;
        case 'BORROWING':
          borrowed += tx.amount;
          break;
        case 'DEBT_PAYMENT':
          debtPaid += tx.amount;
          break;
        case 'TRANSFER_IN':
          transfersNet += tx.amount;
          break;
        case 'TRANSFER_OUT':
          transfersNet -= tx.amount;
          break;
        case 'UNTRACKED_IN':
          untrackedNet += tx.amount;
          break;
        case 'UNTRACKED_OUT':
          untrackedNet -= tx.amount;
          break;
        case 'SAVINGS_DEPOSIT':
          saved += tx.amount;
          break;
        case 'SAVINGS_WITHDRAWAL':
          savingsUsed += tx.amount;
          break;
      }
    }

    const cashChange =
      income - spending + borrowed - debtPaid + transfersNet + untrackedNet - saved + savingsUsed;
    const cashBalance = hasEntriesUpToMonth ? round2(cumCash) : 0;
    const savingsBalance = hasEntriesUpToMonth ? round2(cumSavings) : 0;
    const planned = plannedByMonth.get(monthIndex) ?? { income: 0, spending: 0, savings: 0 };

    return {
      monthIndex,
      monthName,
      income: round2(income),
      spending: round2(spending),
      borrowed: round2(borrowed),
      debtPaid: round2(debtPaid),
      transfersNet: round2(transfersNet),
      untrackedNet: round2(untrackedNet),
      saved: round2(saved),
      savingsUsed: round2(savingsUsed),
      cashChange: round2(cashChange),
      cashBalance,
      savingsBalance,
      totalBalance: round2(cashBalance + savingsBalance),
      plannedIncome: planned.income,
      plannedSpending: planned.spending,
      plannedSavings: planned.savings,
    };
  });
}

export function buildMonthInsights(params: {
  selectedYear: number;
  selectedMonth: number;
  openingCash: number;
  transactionsDesc: LedgerTransactionRow[];
}): MonthInsights {
  const { selectedYear, selectedMonth, openingCash, transactionsDesc } = params;
  const prefix = getMonthPrefix(selectedYear, selectedMonth);
  const monthStart = `${prefix}-01`;
  const daysInMonth = new Date(Date.UTC(selectedYear, selectedMonth, 0)).getUTCDate();

  const dailySpending = new Array<number>(daysInMonth).fill(0);
  const dailyChange = new Array<number>(daysInMonth).fill(0);
  const groupTotals = new Map<string, number>();
  let balance = openingCash;
  let lastActiveDay = -1;

  for (let i = transactionsDesc.length - 1; i >= 0; i--) {
    const tx = transactionsDesc[i];
    if (tx.transactionDate < monthStart) {
      balance += tx.cashChange;
      continue;
    }
    if (!tx.transactionDate.startsWith(prefix)) continue;

    const day = Number(tx.transactionDate.slice(8, 10)) - 1;
    dailyChange[day] += tx.cashChange;
    lastActiveDay = Math.max(lastActiveDay, day);

    if (tx.flowType === 'EXPENSE') {
      dailySpending[day] += tx.amount;
      groupTotals.set(tx.budgetGroupName, (groupTotals.get(tx.budgetGroupName) ?? 0) + tx.amount);
    }
  }

  const dailyBalance: number[] = [];
  for (let d = 0; d <= lastActiveDay; d++) {
    balance += dailyChange[d];
    dailyBalance.push(round2(balance));
  }

  return {
    dailySpending: dailySpending.map(round2),
    dailyBalance,
    spendingByGroup: [...groupTotals.entries()]
      .map(([name, amount]) => ({ name, amount: round2(amount) }))
      .sort((a, b) => b.amount - a.amount),
  };
}

export function computeReconciliation(params: {
  accounts: AccountBalanceRow[];
  transactionsDesc: LedgerTransactionRow[];
  openingCash: number;
}): ReconciliationSummary {
  const { accounts, transactionsDesc, openingCash } = params;
  const totalHeldInAccounts = round2(accounts.reduce((acc, a) => acc + a.currentBalance, 0));
  const ledgerCashBalance =
    transactionsDesc.length > 0 ? transactionsDesc[0].runningCashBalance : openingCash;

  return {
    totalHeldInAccounts,
    ledgerCashBalance,
    difference: round2(totalHeldInAccounts - ledgerCashBalance),
  };
}
