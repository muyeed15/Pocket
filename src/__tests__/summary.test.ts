import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildMonthInsights,
  buildYearlyMonthlySummary,
  computeReconciliation,
  isServiceChargeTransaction,
} from '@/lib/summary';
import type {
  AccountBalanceRow,
  LedgerTransactionRow,
  TransferRow,
} from '@/types/ledger';

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

  it('folds transfer service charges into monthly summary, daily balance, and reconciliation', () => {
    const transfers: TransferRow[] = [
      {
        id: 'tr-1',
        transferDate: '2026-10-20',
        fromAccountId: 'a2',
        fromAccountName: 'bKash',
        toAccountId: 'a1',
        toAccountName: 'Cash',
        amount: 500,
        feeAmount: 10,
        description: 'Cash out',
      },
      {
        id: 'tr-2',
        transferDate: '2026-11-04',
        fromAccountId: 'a2',
        fromAccountName: 'bKash',
        toAccountId: 'a1',
        toAccountName: 'Cash',
        amount: 1000,
        feeAmount: 18.5,
        description: null,
      },
      {
        id: 'tr-3',
        transferDate: '2026-11-05',
        fromAccountId: 'a1',
        fromAccountName: 'Cash',
        toAccountId: 'a2',
        toAccountName: 'bKash',
        amount: 200,
        feeAmount: 0,
        description: null,
      },
    ];

    const summary = buildYearlyMonthlySummary({
      selectedYear: 2026,
      openingCash: 1000,
      openingSavings: 0,
      transactionsDesc: [],
      transfers,
      plannedByMonth: new Map(),
    });

    const oct = summary[9];
    assert.equal(oct.transferFees, 10);
    assert.equal(oct.cashChange, -10);
    assert.equal(oct.cashBalance, 990);

    const nov = summary[10];
    assert.equal(nov.transferFees, 18.5);
    assert.equal(nov.cashChange, -18.5);
    assert.equal(nov.cashBalance, 971.5);

    const insights = buildMonthInsights({
      selectedYear: 2026,
      selectedMonth: 11,
      openingCash: 1000,
      transactionsDesc: [],
      transfers,
    });
    assert.deepEqual(insights.dailyBalance, [990, 990, 990, 971.5]);

    const accounts: AccountBalanceRow[] = [
      {
        accountId: 'a1',
        accountName: 'Cash',
        accountType: 'CASH',
        sortOrder: 0,
        openingBalance: 0,
        moneyIn: 1500,
        moneyOut: 200,
        currentBalance: 1300,
      },
      {
        accountId: 'a2',
        accountName: 'bKash',
        accountType: 'MFS',
        sortOrder: 1,
        openingBalance: 1000,
        moneyIn: 200,
        moneyOut: 1528.5,
        currentBalance: -328.5,
      },
    ];

    const reconciled = computeReconciliation({
      accounts,
      transactionsDesc: [],
      transfers,
      openingCash: 1000,
    });
    assert.equal(reconciled.totalHeldInAccounts, 971.5);
    assert.equal(reconciled.ledgerCashBalance, 971.5);
    assert.equal(reconciled.difference, 0);
  });

  it('identifies bank/transfer fee and service charge expense transactions without matching unrelated expenses', () => {
    assert.equal(
      isServiceChargeTransaction({
        flowType: 'EXPENSE',
        categoryName: 'Bank and transfer fees',
        description: 'NPSB',
      }),
      true
    );
    assert.equal(
      isServiceChargeTransaction({
        flowType: 'EXPENSE',
        categoryName: 'Bank service fees',
        description: null,
      }),
      true
    );
    assert.equal(
      isServiceChargeTransaction({
        flowType: 'EXPENSE',
        categoryName: 'Food and drinks',
        description: 'Fund transfer charge',
      }),
      true
    );
    assert.equal(
      isServiceChargeTransaction({
        flowType: 'EXPENSE',
        categoryName: 'Exam fees',
        description: 'University exam fee',
      }),
      false
    );
    assert.equal(
      isServiceChargeTransaction({
        flowType: 'TRANSFER_OUT',
        categoryName: 'Money sent',
        description: 'Transfer fee',
      }),
      false
    );
  });
});
