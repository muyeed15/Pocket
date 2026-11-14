import { installDom } from './setup';
installDom();

import React from 'react';
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import {
  CASH_FLOW_DRILLDOWN_MAP,
  DEFAULT_LEDGER_FILTERS,
  TransactionsView,
  type LedgerFilterState,
} from '@/components/transactions/TransactionsView';
import type {
  AccountBalanceRow,
  CategoryOption,
  LedgerTransactionRow,
  SavingsFundBalanceRow,
  TransferRow,
} from '@/types/ledger';

afterEach(cleanup);

const sampleTx: LedgerTransactionRow[] = [
  {
    id: 'tx-1',
    entrySequence: 1,
    transactionDate: '2026-11-10',
    description: 'Morning coffee',
    amount: 180,
    legacyCategory: null,
    categoryId: 'cat-food',
    categoryName: 'Food and drinks',
    flowType: 'EXPENSE',
    budgetGroupId: 'bg-1',
    budgetGroupName: 'Essentials',
    savingsFundId: null,
    savingsFundName: null,
    accountId: 'acc-cash',
    accountName: 'Cash',
    cashChange: -180,
    runningCashBalance: 820,
    savingsChange: 0,
    runningSavingsBalance: 0,
  },
  {
    id: 'tx-2',
    entrySequence: 2,
    transactionDate: '2026-10-15',
    description: 'October salary',
    amount: 50000,
    legacyCategory: null,
    categoryId: 'cat-salary',
    categoryName: 'Salary',
    flowType: 'INCOME',
    budgetGroupId: null,
    budgetGroupName: 'Not budgeted',
    savingsFundId: null,
    savingsFundName: null,
    accountId: 'acc-bank',
    accountName: 'Bank',
    cashChange: 50000,
    runningCashBalance: 51000,
    savingsChange: 0,
    runningSavingsBalance: 0,
  },
];

describe('Transactions UI', () => {
  it('renders day-grouped TransactionList and triggers Edit and Delete', () => {
    let editedId = '';
    let deletedId = '';

    render(
      <TransactionList
        transactions={[sampleTx[0]]}
        isPending={false}
        onEdit={(tx) => {
          editedId = tx.id;
        }}
        onDelete={(id) => {
          deletedId = id;
        }}
      />
    );

    assert.ok(screen.getByText('Tuesday 10 November'));
    assert.ok(screen.getByText('Morning coffee'));

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    assert.equal(editedId, 'tx-1');

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    assert.equal(deletedId, '');
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    assert.equal(deletedId, 'tx-1');
  });

  it('filters TransactionsView by scope, flow type, and search query', () => {
    render(
      <TransactionsView
        selectedYear={2026}
        selectedMonth={11}
        transactions={sampleTx}
        isPending={false}
        onEditTransaction={() => {}}
        onDeleteTransaction={() => {}}
      />
    );

    // Default scope is "This month" (November 2026)
    assert.ok(screen.getByText('Morning coffee'));
    assert.equal(screen.queryByText('October salary'), null);

    // Switch to "All time"
    fireEvent.click(screen.getByRole('button', { name: 'All time' }));
    assert.ok(screen.getByText('October salary'));

    // Search filter
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search transactions' }), {
      target: { value: 'coffee' },
    });
    assert.ok(screen.getByText('Morning coffee'));
    assert.equal(screen.queryByText('October salary'), null);

    // Clear search and filter by INCOME via Combobox
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search transactions' }), {
      target: { value: '' },
    });
    const flowCombobox = screen.getByRole('combobox', { name: 'Filter by type' });
    fireEvent.focus(flowCombobox);
    fireEvent.change(flowCombobox, { target: { value: 'Income' } });
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Income' }));
    assert.equal(screen.queryByText('Morning coffee'), null);
    assert.ok(screen.getByText('October salary'));
  });

  it('pre-fills TransactionForm when editing and toggles Savings fund field', () => {
    const categories: CategoryOption[] = [
      {
        id: 'cat-food',
        name: 'Food and drinks',
        flowType: 'EXPENSE',
        budgetGroupId: 'bg-1',
        budgetGroupName: 'Essentials',
        defaultSavingsFundId: null,
      },
      {
        id: 'cat-save',
        name: 'Savings',
        flowType: 'SAVINGS_DEPOSIT',
        budgetGroupId: null,
        budgetGroupName: null,
        defaultSavingsFundId: 'sf-1',
      },
    ];
    const accounts: AccountBalanceRow[] = [
      {
        accountId: 'acc-cash',
        accountName: 'Cash',
        accountType: 'CASH',
        sortOrder: 0,
        openingBalance: 0,
        moneyIn: 0,
        moneyOut: 0,
        currentBalance: 0,
      },
    ];
    const savingsFunds: SavingsFundBalanceRow[] = [
      {
        savingsFundId: 'sf-1',
        savingsFundName: 'Emergency Fund',
        sortOrder: 0,
        openingBalance: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        currentBalance: 0,
      },
    ];

    render(
      <TransactionForm
        categories={categories}
        accounts={accounts}
        savingsFunds={savingsFunds}
        initialTransaction={sampleTx[0]}
        isPending={false}
        onSubmit={() => {}}
      />
    );

    assert.equal(
      (screen.getByPlaceholderText('0.00') as HTMLInputElement).value,
      '180'
    );
    assert.equal(
      (screen.getByPlaceholderText('Optional') as HTMLInputElement).value,
      'Morning coffee'
    );
    assert.ok(screen.getByRole('button', { name: 'Save changes' }));
    assert.equal(screen.queryByRole('combobox', { name: 'Savings fund' }), null);

    // Switch category by typing in Combobox -> Savings fund field appears and pre-fills default fund
    const categoryInput = screen.getByRole('combobox', { name: /Category/i });
    fireEvent.focus(categoryInput);
    fireEvent.change(categoryInput, { target: { value: 'Sav' } });
    fireEvent.mouseDown(screen.getByRole('option', { name: /Savings/i }));
    const fundBox = screen.getByRole('combobox', { name: 'Savings fund' }) as HTMLInputElement;
    assert.equal(fundBox.value, 'Emergency Fund');
  });

  it('requires selecting an account before saving a transaction', () => {
    let submitted: FormData | null = null;
    const nullAccountTx: LedgerTransactionRow = {
      ...sampleTx[0],
      accountId: null,
      accountName: null,
    };

    render(
      <TransactionForm
        categories={[
          {
            id: 'cat-food',
            name: 'Food and drinks',
            flowType: 'EXPENSE',
            budgetGroupId: 'bg-1',
            budgetGroupName: 'Essentials',
            defaultSavingsFundId: null,
          },
        ]}
        accounts={[
          {
            accountId: 'acc-cash',
            accountName: 'Cash',
            accountType: 'CASH',
            sortOrder: 0,
            openingBalance: 0,
            moneyIn: 0,
            moneyOut: 0,
            currentBalance: 0,
          },
        ]}
        savingsFunds={[]}
        initialTransaction={nullAccountTx}
        isPending={false}
        onSubmit={(fd) => {
          submitted = fd;
        }}
      />
    );

    const accountCombobox = screen.getByPlaceholderText('Select account') as HTMLInputElement;
    assert.equal(accountCombobox.required, true);
    assert.equal(accountCombobox.value, '');
    assert.equal(accountCombobox.checkValidity(), false);

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    assert.equal(submitted, null);

    fireEvent.focus(accountCombobox);
    fireEvent.mouseDown(screen.getByRole('option', { name: /Cash/ }));

    assert.equal(accountCombobox.checkValidity(), true);
    assert.equal(accountCombobox.value, 'Cash');

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    assert.ok(submitted);
    assert.equal((submitted as FormData).get('accountId'), 'acc-cash');
    assert.equal((submitted as FormData).get('categoryId'), 'cat-food');
  });

  it('shows transfer service charges as cash-out entries in Ledger and supports Service charges filter', () => {
    let editedTransferId = '';
    let deletedTransferId = '';
    const sampleTransfers: TransferRow[] = [
      {
        id: 'tr-1',
        transferDate: '2026-11-12',
        fromAccountId: 'acc-bkash',
        fromAccountName: 'bKash',
        toAccountId: 'acc-cash',
        toAccountName: 'Cash',
        amount: 1000,
        feeAmount: 18.5,
        description: 'Cash out',
      },
      {
        id: 'tr-2',
        transferDate: '2026-11-11',
        fromAccountId: 'acc-cash',
        fromAccountName: 'Cash',
        toAccountId: 'acc-bank',
        toAccountName: 'Bank',
        amount: 500,
        feeAmount: 0,
        description: 'Zero-fee transfer',
      },
      {
        id: 'tr-3',
        transferDate: '2026-10-18',
        fromAccountId: 'acc-bank',
        fromAccountName: 'Bank',
        toAccountId: 'acc-bkash',
        toAccountName: 'bKash',
        amount: 2500,
        feeAmount: 15,
        description: null,
      },
    ];

    render(
      <TransactionsView
        selectedYear={2026}
        selectedMonth={11}
        transactions={sampleTx}
        transfers={sampleTransfers}
        isPending={false}
        onEditTransaction={() => {}}
        onDeleteTransaction={() => {}}
        onEditTransfer={(tr) => {
          editedTransferId = tr.id;
        }}
        onDeleteTransfer={(id) => {
          deletedTransferId = id;
        }}
      />
    );

    // Month scope shows Nov transaction + Nov service charge (zero-fee transfer stays on Transfers page)
    assert.ok(screen.getByText('Service charge · Cash out'));
    assert.ok(screen.getByText('Transfer, bKash to Cash'));
    assert.ok(screen.getByText('Morning coffee'));
    assert.equal(screen.queryByText('Zero-fee transfer'), null);

    // Nov top metric cards: Money out = 180 + 18.50 = 198.50, Net = -198.50
    assert.ok(screen.getByText('Money in'));
    assert.ok(screen.getByText('Money out'));
    assert.ok(screen.getAllByText('Tk 198.50').length >= 1);
    assert.ok(screen.getAllByText('-Tk 198.50').length >= 1);
    assert.equal(screen.queryByText(/-Tk 198\.50 out/), null);

    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
    assert.deepEqual(headings, ['Thursday 12 November', 'Tuesday 10 November']);

    // Filter specifically by Service charges
    const flowCombobox = screen.getByRole('combobox', { name: 'Filter by type' });
    fireEvent.focus(flowCombobox);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Service charges' }));

    assert.equal(screen.queryByText('Morning coffee'), null);
    assert.ok(screen.getByText('Service charge · Cash out'));
    assert.ok(screen.getByText('1 entry in November'));
    assert.ok(screen.getByText('Tk 18.50'));

    // Switch to All time -> includes October service charge (-15.00), excludes zero-fee
    fireEvent.click(screen.getByRole('button', { name: 'All time' }));
    assert.ok(screen.getByText('Transfer, Bank to bKash'));
    assert.ok(screen.getByText('2 entries all time'));
    assert.ok(screen.getByText('Tk 33.50'));

    // Edit & Delete transfer from Ledger
    const editBtns = screen.getAllByRole('button', { name: 'Edit transfer' });
    fireEvent.click(editBtns[0]);
    assert.equal(editedTransferId, 'tr-1');

    const deleteBtns = screen.getAllByRole('button', { name: 'Delete transfer' });
    fireEvent.click(deleteBtns[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete transfer' }));
    assert.equal(deletedTransferId, 'tr-1');
  });

  it('includes previous expense-recorded service charges alongside transfer charges in Ledger Service charges view and search', () => {
    const historyTx: LedgerTransactionRow[] = [
      ...sampleTx,
      {
        id: 'tx-fee-1',
        entrySequence: 4,
        transactionDate: '2026-10-31',
        description: 'NPSB',
        amount: 9.99,
        legacyCategory: null,
        categoryId: 'cat-fee',
        categoryName: 'Bank and transfer fees',
        flowType: 'EXPENSE',
        budgetGroupId: 'bg-1',
        budgetGroupName: 'Essentials',
        savingsFundId: null,
        savingsFundName: null,
        accountId: null,
        accountName: null,
        cashChange: -9.99,
        runningCashBalance: 990.01,
        savingsChange: 0,
        runningSavingsBalance: 0,
      },
      {
        id: 'tx-fee-2',
        entrySequence: 3,
        transactionDate: '2026-10-27',
        description: 'Fund transfer charge',
        amount: 135.04,
        legacyCategory: null,
        categoryId: 'cat-fee',
        categoryName: 'Bank and transfer fees',
        flowType: 'EXPENSE',
        budgetGroupId: 'bg-1',
        budgetGroupName: 'Essentials',
        savingsFundId: null,
        savingsFundName: null,
        accountId: null,
        accountName: null,
        cashChange: -135.04,
        runningCashBalance: 1125.05,
        savingsChange: 0,
        runningSavingsBalance: 0,
      },
    ];
    const sampleTransfers: TransferRow[] = [
      {
        id: 'tr-nov-fee',
        transferDate: '2026-11-13',
        fromAccountId: 'acc-bkash',
        fromAccountName: 'bKash',
        toAccountId: 'acc-bank',
        toAccountName: 'Eastern Bank',
        amount: 2950.73,
        feeAmount: 49.27,
        description: null,
      },
    ];

    render(
      <TransactionsView
        selectedYear={2026}
        selectedMonth={11}
        transactions={historyTx}
        transfers={sampleTransfers}
        isPending={false}
        onEditTransaction={() => {}}
        onDeleteTransaction={() => {}}
      />
    );

    // Searching "service charge" across All time surfaces both historical fee entries and transfer charges
    fireEvent.click(screen.getByRole('button', { name: 'All time' }));
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search transactions' }), {
      target: { value: 'service charge' },
    });
    assert.ok(screen.getByText('Service charge'));
    assert.ok(screen.getByText('NPSB'));
    assert.ok(screen.getByText('Fund transfer charge'));
    assert.equal(screen.queryByText('Morning coffee'), null);

    // Clear search and filter by Service charges
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search transactions' }), {
      target: { value: '' },
    });
    const flowCombobox = screen.getByRole('combobox', { name: 'Filter by type' });
    fireEvent.focus(flowCombobox);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Service charges' }));

    assert.ok(screen.getByText('Service charge'));
    assert.ok(screen.getByText('NPSB'));
    assert.ok(screen.getByText('Fund transfer charge'));
    assert.equal(screen.queryByText('Morning coffee'), null);
    assert.ok(screen.getByText('3 entries all time'));
    assert.ok(screen.getByText('Tk 194.30'));
  });

  it('avoids duplicate category subtitles when description is omitted and supports Clear filters and Account filter in Ledger', () => {
    const noDescTx: LedgerTransactionRow[] = [
      ...sampleTx,
      {
        id: 'tx-untracked',
        entrySequence: 5,
        transactionDate: '2026-11-12',
        description: null,
        amount: 20,
        legacyCategory: null,
        categoryId: 'cat-untracked',
        categoryName: 'Untracked money in',
        flowType: 'UNTRACKED_IN',
        budgetGroupId: null,
        budgetGroupName: 'Not budgeted',
        savingsFundId: 'sf-1',
        savingsFundName: 'Reserve',
        accountId: 'acc-bkash',
        accountName: 'bKash',
        cashChange: 20,
        runningCashBalance: 1020,
        savingsChange: 0,
        runningSavingsBalance: 0,
      },
    ];
    const accounts: AccountBalanceRow[] = [
      {
        accountId: 'acc-cash',
        accountName: 'Cash',
        accountType: 'CASH',
        sortOrder: 0,
        openingBalance: 1000,
        moneyIn: 0,
        moneyOut: 180,
        currentBalance: 820,
      },
      {
        accountId: 'acc-bkash',
        accountName: 'bKash',
        accountType: 'MFS',
        sortOrder: 1,
        openingBalance: 0,
        moneyIn: 20,
        moneyOut: 0,
        currentBalance: 20,
      },
    ];

    render(
      <TransactionsView
        selectedYear={2026}
        selectedMonth={11}
        transactions={noDescTx}
        accounts={accounts}
        isPending={false}
        onEditTransaction={() => {}}
        onDeleteTransaction={() => {}}
      />
    );

    // Descriptionless row renders category title once and account/fund subtitle cleanly
    assert.equal(screen.getAllByText('Untracked money in').length, 1);
    assert.ok(screen.getByText('bKash · Reserve'));

    // Filter by account -> hides Cash entry, shows inline Clear filters
    const accountCombobox = screen.getByRole('combobox', { name: 'Filter by account' });
    fireEvent.focus(accountCombobox);
    fireEvent.mouseDown(screen.getByRole('option', { name: /bKash/ }));
    assert.equal(screen.queryByText('Morning coffee'), null);
    assert.ok(screen.getByText('Untracked money in'));

    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    assert.ok(screen.getByText('Morning coffee'));
  });

  it('filters Transfers and Adjustments groups and maps every cash-flow drill-down away from ALL', () => {
    assert.deepEqual(CASH_FLOW_DRILLDOWN_MAP, {
      income: 'INCOME',
      spending: 'EXPENSE',
      borrowed: 'BORROWING',
      debtPaid: 'DEBT_PAYMENT',
      transfersNet: 'TRANSFERS',
      transferFees: 'SERVICE_CHARGES',
      untrackedNet: 'ADJUSTMENTS',
      saved: 'SAVINGS_DEPOSIT',
      savingsUsed: 'SAVINGS_WITHDRAWAL',
    });

    const drilldownTx: LedgerTransactionRow[] = [
      ...sampleTx,
      {
        id: 'tx-transfer-in',
        entrySequence: 5,
        transactionDate: '2026-11-11',
        description: 'Received from card wallet',
        amount: 500,
        legacyCategory: null,
        categoryId: 'cat-tr-in',
        categoryName: 'Transfer in',
        flowType: 'TRANSFER_IN',
        budgetGroupId: null,
        budgetGroupName: 'Not budgeted',
        savingsFundId: null,
        savingsFundName: null,
        accountId: 'acc-cash',
        accountName: 'Cash',
        cashChange: 500,
        runningCashBalance: 1320,
        savingsChange: 0,
        runningSavingsBalance: 0,
      },
      {
        id: 'tx-transfer-out',
        entrySequence: 6,
        transactionDate: '2026-11-12',
        description: 'Sent to bKash wallet',
        amount: 300,
        legacyCategory: null,
        categoryId: 'cat-tr-out',
        categoryName: 'Transfer out',
        flowType: 'TRANSFER_OUT',
        budgetGroupId: null,
        budgetGroupName: 'Not budgeted',
        savingsFundId: null,
        savingsFundName: null,
        accountId: 'acc-cash',
        accountName: 'Cash',
        cashChange: -300,
        runningCashBalance: 1020,
        savingsChange: 0,
        runningSavingsBalance: 0,
      },
      {
        id: 'tx-untracked-in',
        entrySequence: 7,
        transactionDate: '2026-11-13',
        description: 'Found wallet balance',
        amount: 200,
        legacyCategory: null,
        categoryId: 'cat-adj-in',
        categoryName: 'Untracked money in',
        flowType: 'UNTRACKED_IN',
        budgetGroupId: null,
        budgetGroupName: 'Not budgeted',
        savingsFundId: null,
        savingsFundName: null,
        accountId: 'acc-cash',
        accountName: 'Cash',
        cashChange: 200,
        runningCashBalance: 1220,
        savingsChange: 0,
        runningSavingsBalance: 0,
      },
      {
        id: 'tx-untracked-out',
        entrySequence: 8,
        transactionDate: '2026-11-14',
        description: 'Lost petty cash',
        amount: 50,
        legacyCategory: null,
        categoryId: 'cat-adj-out',
        categoryName: 'Untracked money out',
        flowType: 'UNTRACKED_OUT',
        budgetGroupId: null,
        budgetGroupName: 'Not budgeted',
        savingsFundId: null,
        savingsFundName: null,
        accountId: 'acc-cash',
        accountName: 'Cash',
        cashChange: -50,
        runningCashBalance: 1170,
        savingsChange: 0,
        runningSavingsBalance: 0,
      },
    ];

    const sampleTransfers: TransferRow[] = [
      {
        id: 'tr-fee',
        transferDate: '2026-11-12',
        description: 'ATM transfer fee',
        fromAccountId: 'acc-cash',
        fromAccountName: 'Cash',
        toAccountId: 'acc-bkash',
        toAccountName: 'bKash',
        amount: 1000,
        feeAmount: 15,
      },
    ];

    const { rerender } = render(
      <TransactionsView
        selectedYear={2026}
        selectedMonth={11}
        transactions={drilldownTx}
        transfers={sampleTransfers}
        initialFlow="TRANSFERS"
        isPending={false}
        onEditTransaction={() => {}}
        onDeleteTransaction={() => {}}
      />
    );

    assert.ok(screen.getByText('Received from card wallet'));
    assert.ok(screen.getByText('Sent to bKash wallet'));
    assert.equal(screen.queryByText('Morning coffee'), null);
    assert.equal(screen.queryByText('Found wallet balance'), null);
    assert.equal(screen.queryByText('ATM transfer fee'), null);

    // Selecting Adjustments via combobox switches to UNTRACKED_IN and UNTRACKED_OUT only
    const flowCombobox = screen.getByRole('combobox', { name: 'Filter by type' });
    fireEvent.focus(flowCombobox);
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Adjustments' }));

    assert.ok(screen.getByText('Found wallet balance'));
    assert.ok(screen.getByText('Lost petty cash'));
    assert.equal(screen.queryByText('Received from card wallet'), null);
    assert.equal(screen.queryByText('Sent to bKash wallet'), null);
    assert.equal(screen.queryByText('Morning coffee'), null);

    // Passing initialFlow="ADJUSTMENTS" directly (overview drill-down preset) yields same group
    rerender(
      <TransactionsView
        key="adj-preset"
        selectedYear={2026}
        selectedMonth={11}
        transactions={drilldownTx}
        transfers={sampleTransfers}
        initialFlow="ADJUSTMENTS"
        isPending={false}
        onEditTransaction={() => {}}
        onDeleteTransaction={() => {}}
      />
    );

    assert.ok(screen.getByText('Found wallet balance'));
    assert.ok(screen.getByText('Lost petty cash'));
    assert.equal(screen.queryByText('Morning coffee'), null);
  });

  it('retains filter resets to All across tab unmounts instead of reverting to drill-down preset', () => {
    const loanTx: LedgerTransactionRow[] = [
      ...sampleTx,
      {
        id: 'tx-loan',
        entrySequence: 5,
        transactionDate: '2026-11-12',
        description: 'Friend loan received',
        amount: 2000,
        legacyCategory: null,
        categoryId: 'cat-loan',
        categoryName: 'Loan received',
        flowType: 'BORROWING',
        budgetGroupId: null,
        budgetGroupName: 'Not budgeted',
        savingsFundId: null,
        savingsFundName: null,
        accountId: 'acc-cash',
        accountName: 'Cash',
        cashChange: 2000,
        runningCashBalance: 2820,
        savingsChange: 0,
        runningSavingsBalance: 0,
      },
    ];

    function TabHarness() {
      const [tab, setTab] = React.useState<'ledger' | 'overview'>('ledger');
      const [filters, setFilters] = React.useState<LedgerFilterState>({
        ...DEFAULT_LEDGER_FILTERS,
        flow: 'BORROWING',
      });
      return (
        <div>
          <button type="button" onClick={() => setTab('overview')}>
            Overview tab
          </button>
          <button type="button" onClick={() => setTab('ledger')}>
            Ledger tab
          </button>
          {tab === 'ledger' ? (
            <TransactionsView
              selectedYear={2026}
              selectedMonth={11}
              transactions={loanTx}
              filters={filters}
              onFiltersChange={setFilters}
              isPending={false}
              onEditTransaction={() => {}}
              onDeleteTransaction={() => {}}
            />
          ) : (
            <div>Overview placeholder</div>
          )}
        </div>
      );
    }

    render(<TabHarness />);

    // Initially shows Borrowing drill-down only
    assert.ok(screen.getByText('Friend loan received'));
    assert.equal(screen.queryByText('Morning coffee'), null);

    // Reset filter to All types via Clear filters, then switch away and back
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }));
    assert.ok(screen.getByText('Morning coffee'));

    fireEvent.click(screen.getByRole('button', { name: 'Overview tab' }));
    assert.equal(screen.queryByText('Friend loan received'), null);

    fireEvent.click(screen.getByRole('button', { name: 'Ledger tab' }));
    assert.ok(screen.getByText('Friend loan received'));
    assert.ok(screen.getByText('Morning coffee'));
    const flowCombobox = screen.getByRole('combobox', {
      name: 'Filter by type',
    }) as HTMLInputElement;
    assert.equal(flowCombobox.value, 'All types');
  });
});
