import { installDom } from './setup';
installDom();

import React from 'react';
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AccountsView } from '@/components/accounts/AccountsView';
import { BudgetView } from '@/components/budget/BudgetView';
import { MonthFlowList } from '@/components/dashboard/MonthFlowList';
import { SpendingByGroup } from '@/components/dashboard/SpendingByGroup';
import { YearlySummaryView } from '@/components/summary/YearlySummaryView';
import { CurrencyProvider } from '@/components/ui/CurrencyContext';
import type {
  AccountBalanceRow,
  BudgetProgressRow,
  MonthlySummaryRow,
} from '@/types/ledger';

afterEach(cleanup);

const sampleSummary: MonthlySummaryRow = {
  monthIndex: 11,
  monthName: 'November',
  income: 5000,
  spending: 1200,
  borrowed: 0,
  debtPaid: 0,
  transfersNet: 0,
  transferFees: 0,
  untrackedNet: 0,
  saved: 400,
  savingsUsed: 0,
  cashChange: 3400,
  cashBalance: 4400,
  savingsBalance: 400,
  totalBalance: 4800,
  plannedIncome: 5000,
  plannedSpending: 2000,
  plannedSavings: 500,
};

const sampleBudgetItem: BudgetProgressRow = {
  id: 'b-1',
  budgetMonth: '2026-11-01',
  itemType: 'SPENDING',
  targetId: 'bg-1',
  targetName: 'Essentials',
  plannedAmount: 2000,
  actualAmount: 1200,
  remainingAmount: 800,
  usedPercentage: 60,
};

const sampleAccounts: AccountBalanceRow[] = [
  {
    accountId: 'acc-1',
    accountName: 'Cash',
    accountType: 'CASH',
    sortOrder: 0,
    openingBalance: 1000,
    moneyIn: 500,
    moneyOut: 200,
    currentBalance: 1300,
  },
];

describe('BudgetView & AccountsView UI', () => {
  it('renders custom currency symbol and opens pre-filled Edit target sheet in BudgetView', () => {
    let submitted: FormData | null = null;
    render(
      <CurrencyProvider symbol="$">
        <BudgetView
          selectedYear={2026}
          selectedMonth={11}
          summary={sampleSummary}
          budgetItems={[sampleBudgetItem]}
          budgetGroups={[{ id: 'bg-1', name: 'Essentials' }]}
          categories={[]}
          savingsFunds={[]}
          isPending={false}
          onUpsertBudget={(fd, onSuccess) => {
            submitted = fd;
            onSuccess();
          }}
          onDeleteBudgetItem={() => {}}
        />
      </CurrencyProvider>
    );

    assert.ok(screen.getByText('$ 2,000.00'));
    assert.ok(screen.getByText('$ 1,200.00 of $ 2,000.00'));

    fireEvent.click(screen.getByRole('button', { name: 'Edit target' }));
    assert.ok(screen.getByRole('dialog', { name: 'Edit monthly target' }));

    const amountInput = screen.getByPlaceholderText('0.00') as HTMLInputElement;
    assert.equal(amountInput.value, '2000');

    fireEvent.change(amountInput, { target: { value: '2500' } });
    fireEvent.click(screen.getByRole('button', { name: 'Update target' }));

    assert.ok(submitted);
    assert.equal((submitted as FormData).get('itemType'), 'SPENDING');
    assert.equal((submitted as FormData).get('targetId'), 'bg-1');
    assert.equal((submitted as FormData).get('plannedAmount'), '2500');
  });

  it('formats AccountsView with CurrencyProvider and closes inline balance edit on Escape', () => {
    render(
      <CurrencyProvider symbol="€">
        <AccountsView
          accounts={sampleAccounts}
          savingsFunds={[]}
          reconciliation={{
            totalHeldInAccounts: 1300,
            ledgerCashBalance: 1300,
            difference: 0,
          }}
          isPending={false}
          onUpdateOpeningBalance={() => {}}
        />
      </CurrencyProvider>
    );

    assert.ok(screen.getAllByText('€ 1,300.00').length >= 1);
    assert.equal(screen.queryByText('Matches ledger entries'), null);
    assert.ok(screen.getByText(/in € 500.00 · out € 200.00/));
    assert.ok(screen.getByText('No savings funds configured yet'));

    fireEvent.click(screen.getByRole('button', { name: 'Edit opening balance' }));
    const balanceInput = screen.getByDisplayValue('1000');
    fireEvent.keyDown(balanceInput, { key: 'Escape' });
    assert.equal(screen.queryByDisplayValue('1000'), null);
  });

  it('shows Full-year cash flow breakdown explaining Earned vs Spent gap in YearlySummaryView', () => {
    render(
      <YearlySummaryView
        selectedYear={2026}
        selectedMonth={11}
        monthlySummary={[
          {
            ...sampleSummary,
            monthName: 'November',
            income: 50000,
            spending: 32000,
            borrowed: 6000,
            debtPaid: 18000,
            transfersNet: -4500,
            transferFees: 25,
            cashChange: 1475,
            cashBalance: 1475,
          },
        ]}
        onSelectPeriod={() => {}}
      />
    );

    assert.ok(screen.getByText('Full-year cash flow'));
    assert.ok(screen.getByText('Income'));
    assert.ok(screen.getByText('Spending'));
    assert.ok(screen.getByText('Loans received'));
    assert.ok(screen.getByText('Loans repaid'));
    assert.ok(screen.getByText('Transfers'));
    assert.ok(screen.getByText('Service charges'));
    assert.ok(screen.getByText('Cash left end of 2026'));
  });

  it('supports touch cancel and quick navigation in AccountsView and interactive drill-downs in Overview lists', () => {
    let ledgerAccount = '';
    let transferAccount = '';
    render(
      <CurrencyProvider symbol="Tk">
        <AccountsView
          accounts={sampleAccounts}
          savingsFunds={[]}
          reconciliation={{
            totalHeldInAccounts: 1300,
            ledgerCashBalance: 1300,
            difference: 0,
          }}
          isPending={false}
          onUpdateOpeningBalance={() => {}}
          onOpenAccountLedger={(id) => {
            ledgerAccount = id;
          }}
          onOpenAccountTransfers={(id) => {
            transferAccount = id;
          }}
        />
      </CurrencyProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'Edit opening balance' }));
    assert.ok(screen.getByDisplayValue('1000'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    assert.equal(screen.queryByDisplayValue('1000'), null);

    fireEvent.click(screen.getByRole('button', { name: 'View entries' }));
    assert.equal(ledgerAccount, 'acc-1');
    fireEvent.click(screen.getByRole('button', { name: 'View transfers' }));
    assert.equal(transferAccount, 'acc-1');

    let clickedFlow = '';
    let clickedGroup = '';
    render(
      <>
        <MonthFlowList
          summary={{ ...sampleSummary, transferFees: 49.27 }}
          onSelectRow={(k) => {
            clickedFlow = k;
          }}
        />
        <SpendingByGroup
          groups={[{ name: 'Essentials', amount: 1200 }]}
          onSelectGroup={(g) => {
            clickedGroup = g;
          }}
        />
      </>
    );

    fireEvent.click(screen.getByRole('button', { name: /Service charges/i }));
    assert.equal(clickedFlow, 'transferFees');
    fireEvent.click(screen.getByRole('button', { name: /Essentials/i }));
    assert.equal(clickedGroup, 'Essentials');
  });
});
