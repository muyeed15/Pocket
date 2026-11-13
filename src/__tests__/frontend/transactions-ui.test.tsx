import { installDom } from './setup';
installDom();

import React from 'react';
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionsView } from '@/components/transactions/TransactionsView';
import type {
  AccountBalanceRow,
  CategoryOption,
  LedgerTransactionRow,
  SavingsFundBalanceRow,
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

    // Switch category by typing in Combobox -> Savings fund field appears
    const categoryInput = screen.getByRole('combobox', { name: /Category/i });
    fireEvent.focus(categoryInput);
    fireEvent.change(categoryInput, { target: { value: 'Sav' } });
    fireEvent.mouseDown(screen.getByRole('option', { name: /Savings/i }));
    assert.ok(screen.getByRole('combobox', { name: 'Savings fund' }));
  });

  it('allows editing and submitting a transaction without an account', () => {
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

    const accountCombobox = screen.getByPlaceholderText('Optional (no account)') as HTMLInputElement;
    assert.equal(accountCombobox.required, false);
    assert.equal(accountCombobox.value, '');

    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    assert.ok(submitted);
    assert.equal((submitted as FormData).get('accountId'), '');
    assert.equal((submitted as FormData).get('categoryId'), 'cat-food');
  });
});
