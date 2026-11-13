import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMonthInsights,
  buildYearlyMonthlySummary,
  computeReconciliation,
} from '@/lib/summary';
import type { AccountBalanceRow, LedgerTransactionRow } from '@/types/ledger';

function makeTx(
  overrides: Partial<LedgerTransactionRow>
): LedgerTransactionRow {
  return {
    id: 'tx-1',
    entrySequence: 1,
    transactionDate: '2026-11-05',
    description: null,
    amount: 100,
    legacyCategory: null,
    categoryId: 'cat-1',
    categoryName: 'Food',
    flowType: 'EXPENSE',
    budgetGroupId: 'bg-1',
    budgetGroupName: 'Essentials',
    savingsFundId: null,
    savingsFundName: null,
    accountId: 'acc-1',
    accountName: 'Cash',
    cashChange: -100,
    runningCashBalance: 900,
    savingsChange: 0,
    runningSavingsBalance: 0,
    ...overrides,
  };
}

describe('summary aggregations', () => {
  it('builds yearly monthly summary across flow types and cumulative balances', () => {
    const transactionsDesc: LedgerTransactionRow[] = [
      makeTx({
        id: 'tx-4',
        entrySequence: 4,
        transactionDate: '2026-11-10',
        flowType: 'SAVINGS_DEPOSIT',
        amount: 300,
        cashChange: -300,
        savingsChange: 300,
        runningCashBalance: 1400,
        runningSavingsBalance: 500,
      }),
      makeTx({
        id: 'tx-3',
        entrySequence: 3,
        transactionDate: '2026-11-05',
        flowType: 'EXPENSE',
        amount: 400,
        cashChange: -400,
        runningCashBalance: 1700,
      }),
      makeTx({
        id: 'tx-2',
        entrySequence: 2,
        transactionDate: '2026-11-01',
        flowType: 'INCOME',
        amount: 1500,
        cashChange: 1500,
        runningCashBalance: 2100,
      }),
      makeTx({
        id: 'tx-1',
        entrySequence: 1,
        transactionDate: '2026-10-15',
        flowType: 'BORROWING',
        amount: 100,
        cashChange: 100,
        runningCashBalance: 600,
      }),
    ];

    const plannedByMonth = new Map([
      [11, { income: 2000, spending: 1000, savings: 500 }],
    ]);

    const summary = buildYearlyMonthlySummary({
      selectedYear: 2026,
      openingCash: 500,
      openingSavings: 200,
      transactionsDesc,
      plannedByMonth,
    });

    const oct = summary[9];
    assert.equal(oct.monthName, 'October');
    assert.equal(oct.borrowed, 100);
    assert.equal(oct.cashBalance, 600);
    assert.equal(oct.savingsBalance, 200);

    const nov = summary[10];
    assert.equal(nov.monthName, 'November');
    assert.equal(nov.income, 1500);
    assert.equal(nov.spending, 400);
    assert.equal(nov.saved, 300);
    assert.equal(nov.cashChange, 800);
    assert.equal(nov.cashBalance, 1400);
    assert.equal(nov.savingsBalance, 500);
    assert.equal(nov.totalBalance, 1900);
    assert.equal(nov.plannedIncome, 2000);
    assert.equal(nov.plannedSpending, 1000);
    assert.equal(nov.plannedSavings, 500);
  });

  it('builds month insights for daily spending, daily balance, and group totals', () => {
    const transactionsDesc: LedgerTransactionRow[] = [
      makeTx({
        id: 'tx-3',
        transactionDate: '2026-11-03',
        flowType: 'EXPENSE',
        budgetGroupName: 'Lifestyle',
        amount: 250,
        cashChange: -250,
      }),
      makeTx({
        id: 'tx-2',
        transactionDate: '2026-11-02',
        flowType: 'EXPENSE',
        budgetGroupName: 'Essentials',
        amount: 100,
        cashChange: -100,
      }),
      makeTx({
        id: 'tx-1',
        transactionDate: '2026-10-28',
        flowType: 'INCOME',
        amount: 500,
        cashChange: 500,
      }),
    ];

    const insights = buildMonthInsights({
      selectedYear: 2026,
      selectedMonth: 11,
      openingCash: 1000,
      transactionsDesc,
    });

    assert.equal(insights.dailySpending.length, 30);
    assert.equal(insights.dailySpending[1], 100);
    assert.equal(insights.dailySpending[2], 250);
    assert.deepEqual(insights.dailyBalance, [1500, 1400, 1150]);
    assert.deepEqual(insights.spendingByGroup, [
      { name: 'Lifestyle', amount: 250 },
      { name: 'Essentials', amount: 100 },
    ]);
  });

  it('computes account reconciliation and handles empty ledgers', () => {
    const accounts: AccountBalanceRow[] = [
      {
        accountId: 'a1',
        accountName: 'Cash',
        accountType: 'CASH',
        sortOrder: 0,
        openingBalance: 0,
        moneyIn: 1000,
        moneyOut: 200,
        currentBalance: 800,
      },
      {
        accountId: 'a2',
        accountName: 'Bank',
        accountType: 'BANK',
        sortOrder: 1,
        openingBalance: 500,
        moneyIn: 0,
        moneyOut: 0,
        currentBalance: 500,
      },
    ];

    const reconciled = computeReconciliation({
      accounts,
      transactionsDesc: [makeTx({ runningCashBalance: 1300 })],
      openingCash: 500,
    });
    assert.equal(reconciled.totalHeldInAccounts, 1300);
    assert.equal(reconciled.ledgerCashBalance, 1300);
    assert.equal(reconciled.difference, 0);

    const empty = computeReconciliation({
      accounts: [],
      transactionsDesc: [],
      openingCash: 250,
    });
    assert.equal(empty.ledgerCashBalance, 250);
    assert.equal(empty.difference, -250);
  });
});
