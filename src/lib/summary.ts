import { MONTH_NAMES } from './constants';
import { getMonthPrefix, round2 } from './format';
import type {
  AccountBalanceRow,
  LedgerTransactionRow,
  MonthInsights,
  MonthlySummaryRow,
  ReconciliationSummary,
  TransferRow,
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
  transfers?: TransferRow[];
  plannedByMonth: Map<number, PlannedMonthTotals>;
}): MonthlySummaryRow[] {
  const {
    selectedYear,
    openingCash,
    openingSavings,
    transactionsDesc,
    transfers = [],
    plannedByMonth,
  } = params;
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
    let transferFees = 0;
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

    for (const tr of transfers) {
      if (tr.feeAmount <= 0) continue;
      if (tr.transferDate < nextMonthDate) {
        hasEntriesUpToMonth = true;
        cumCash -= tr.feeAmount;
      }
      if (tr.transferDate.startsWith(monthPrefix)) {
        transferFees += tr.feeAmount;
      }
    }

    const cashChange =
      income -
      spending +
      borrowed -
      debtPaid +
      transfersNet -
      transferFees +
      untrackedNet -
      saved +
      savingsUsed;
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
      transferFees: round2(transferFees),
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
  transfers?: TransferRow[];
}): MonthInsights {
  const {
    selectedYear,
    selectedMonth,
    openingCash,
    transactionsDesc,
    transfers = [],
  } = params;
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
    if (day < 0 || day >= daysInMonth) continue;
    dailyChange[day] += tx.cashChange;
    lastActiveDay = Math.max(lastActiveDay, day);

    if (tx.flowType === 'EXPENSE') {
      dailySpending[day] += tx.amount;
      groupTotals.set(tx.categoryName, (groupTotals.get(tx.categoryName) ?? 0) + tx.amount);
    }
  }

  for (const tr of transfers) {
    if (tr.feeAmount <= 0) continue;
    if (tr.transferDate < monthStart) {
      balance -= tr.feeAmount;
      continue;
    }
    if (!tr.transferDate.startsWith(prefix)) continue;

    const day = Number(tr.transferDate.slice(8, 10)) - 1;
    if (day >= 0 && day < daysInMonth) {
      dailyChange[day] -= tr.feeAmount;
      lastActiveDay = Math.max(lastActiveDay, day);
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
  transfers?: TransferRow[];
  openingCash: number;
}): ReconciliationSummary {
  const { accounts, transactionsDesc, transfers = [], openingCash } = params;
  const totalHeldInAccounts = round2(accounts.reduce((acc, a) => acc + a.currentBalance, 0));
  const totalTransferFees = transfers.reduce((sum, tr) => sum + tr.feeAmount, 0);
  const baseLedgerCash =
    transactionsDesc.length > 0 ? transactionsDesc[0].runningCashBalance : openingCash;
  const ledgerCashBalance = round2(baseLedgerCash - totalTransferFees);

  return {
    totalHeldInAccounts,
    ledgerCashBalance,
    difference: round2(totalHeldInAccounts - ledgerCashBalance),
  };
}

/** Shared filter helper for transfer timelines in Ledger and Transfers pages. */
export function filterTransfers(params: {
  transfers: TransferRow[];
  scope: 'month' | 'all';
  monthPrefix: string;
  accountId?: string;
  chargesOnly?: boolean;
  query?: string;
}): TransferRow[] {
  const {
    transfers,
    scope,
    monthPrefix,
    accountId = 'ALL',
    chargesOnly = false,
    query = '',
  } = params;
  const q = query.trim().toLowerCase();

  return transfers.filter((tr) => {
    if (scope === 'month' && !tr.transferDate.startsWith(monthPrefix)) return false;
    if (
      accountId !== 'ALL' &&
      tr.fromAccountId !== accountId &&
      tr.toAccountId !== accountId
    ) {
      return false;
    }
    if (chargesOnly && tr.feeAmount <= 0) return false;
    if (!q) return true;

    return [
      'transfer',
      tr.feeAmount > 0 ? 'service charge' : '',
      tr.fromAccountName,
      tr.toAccountName,
      tr.description,
    ].some((text) => text?.toLowerCase().includes(q));
  });
}

const SERVICE_CHARGE_CATEGORY_NAMES = new Set([
  'bank and transfer fees',
  'bank service fees',
  'credit card charges',
  'currency conversion fees',
]);

const SERVICE_CHARGE_DESCRIPTION_RE =
  /\b(?:service|transfer|bank|card|atm|cash[\s-]?out|send[\s-]?money)\s+(?:charge|fee)s?\b/i;

/** Identifies expense ledger entries recorded as bank or transfer service charges. */
export function isServiceChargeTransaction(
  tx: Pick<LedgerTransactionRow, 'flowType' | 'categoryName' | 'description'>
): boolean {
  if (tx.flowType !== 'EXPENSE') return false;
  if (SERVICE_CHARGE_CATEGORY_NAMES.has(tx.categoryName.trim().toLowerCase())) {
    return true;
  }
  return tx.description ? SERVICE_CHARGE_DESCRIPTION_RE.test(tx.description) : false;
}
