import { installDom } from './setup';
installDom();

import React from 'react';
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { TransferForm } from '@/components/transfers/TransferForm';
import { TransfersView } from '@/components/transfers/TransfersView';
import { CurrencyProvider } from '@/components/ui/CurrencyContext';
import type { AccountBalanceRow, TransferRow } from '@/types/ledger';

afterEach(cleanup);

const sampleAccounts: AccountBalanceRow[] = [
  {
    accountId: 'acc-cash',
    accountName: 'Cash',
    accountType: 'CASH',
    sortOrder: 0,
    openingBalance: 1000,
    moneyIn: 500,
    moneyOut: 200,
    currentBalance: 1300,
  },
  {
    accountId: 'acc-bkash',
    accountName: 'bKash',
    accountType: 'MFS',
    sortOrder: 1,
    openingBalance: 3000,
    moneyIn: 500,
    moneyOut: 1018.5,
    currentBalance: 2481.5,
  },
  {
    accountId: 'acc-bank',
    accountName: 'Bank',
    accountType: 'BANK',
    sortOrder: 2,
    openingBalance: 5000,
    moneyIn: 0,
    moneyOut: 2500,
    currentBalance: 2500,
  },
];

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
    transferDate: '2026-11-10',
    fromAccountId: 'acc-cash',
    fromAccountName: 'Cash',
    toAccountId: 'acc-bkash',
    toAccountName: 'bKash',
    amount: 500,
    feeAmount: 0,
    description: null,
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
    description: 'Top up',
  },
];

describe('Transfers UI', () => {
  it('renders comprehensive TransfersView with metrics, filters, account perspective, edit, and delete', () => {
    let added = false;
    let editedId = '';
    let deletedId = '';

    render(
      <CurrencyProvider symbol="Tk">
        <TransfersView
          selectedYear={2026}
          selectedMonth={11}
          accounts={sampleAccounts}
          transfers={sampleTransfers}
          isPending={false}
          onAddTransfer={() => {
            added = true;
          }}
          onEditTransfer={(tr) => {
            editedId = tr.id;
          }}
          onDeleteTransfer={(id) => {
            deletedId = id;
          }}
        />
      </CurrencyProvider>
    );

    // Month metrics: Nov moved = 1500, charges = 18.50, total deducted = 1518.50
    assert.ok(screen.getByText('Tk 1,500.00'));
    assert.ok(screen.getByText('Tk 18.50'));
    assert.ok(screen.getByText('Tk 1,518.50'));
    assert.ok(screen.getByText('bKash to Cash'));
    assert.ok(screen.getByText('Cash to bKash'));
    assert.equal(screen.queryByText('Bank to bKash'), null);

    // Chronological day headers
    const dayHeadings = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent);
    assert.deepEqual(dayHeadings, ['Thursday 12 November', 'Tuesday 10 November']);

    // Filter by Charges only -> excludes zero-fee Cash to bKash
    fireEvent.click(screen.getByRole('button', { name: 'Charges only' }));
    assert.ok(screen.getByText('bKash to Cash'));
    assert.equal(screen.queryByText('Cash to bKash'), null);

    // Switch to All time -> includes Oct Bank -> bKash too
    fireEvent.click(screen.getByRole('button', { name: 'All time' }));
    assert.ok(screen.getByText('Bank to bKash'));

    // Disable Charges only and switch Account perspective to bKash
    fireEvent.click(screen.getByRole('button', { name: 'Charges only' }));
    const accountCombobox = screen.getByRole('combobox', {
      name: 'Filter by account',
    });
    fireEvent.focus(accountCombobox);
    fireEvent.mouseDown(screen.getByRole('option', { name: /bKash/ }));

    assert.ok(screen.getAllByText('Received').length >= 1);
    assert.ok(screen.getAllByText('Sent').length >= 1);
    assert.ok(screen.getByText('In to bKash'));
    assert.ok(screen.getByText('Out from bKash'));
    assert.ok(screen.getAllByText('Net +Tk 1,981.50').length >= 1);

    // Trigger New, Edit, and Delete transfer callbacks
    fireEvent.click(screen.getByRole('button', { name: 'New transfer' }));
    assert.equal(added, true);

    const editBtns = screen.getAllByRole('button', { name: 'Edit transfer' });
    fireEvent.click(editBtns[0]);
    assert.equal(editedId, 'tr-1');

    const deleteBtns = screen.getAllByRole('button', { name: 'Delete transfer' });
    fireEvent.click(deleteBtns[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete transfer' }));
    assert.equal(deletedId, 'tr-1');
  });

  it('supports optional service charge on create and pre-fills TransferForm on edit', () => {
    const submissions: FormData[] = [];

    const { rerender } = render(
      <CurrencyProvider symbol="Tk">
        <TransferForm
          accounts={sampleAccounts}
          isPending={false}
          onSubmit={(fd) => submissions.push(fd)}
        />
      </CurrencyProvider>
    );

    const amountInput = document.querySelector(
      'input[name="amount"]'
    ) as HTMLInputElement;
    const feeInput = document.querySelector(
      'input[name="feeAmount"]'
    ) as HTMLInputElement;
    assert.equal(feeInput.required, false);

    fireEvent.change(amountInput, { target: { value: '1000' } });

    const comboboxes = screen.getAllByPlaceholderText('Select account');
    fireEvent.focus(comboboxes[0]);
    fireEvent.mouseDown(screen.getByRole('option', { name: /bKash/ }));
    fireEvent.focus(comboboxes[1]);
    fireEvent.mouseDown(screen.getByRole('option', { name: /Cash/ }));

    // Submit with blank optional service charge
    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }));
    assert.equal(submissions.length, 1);
    assert.equal(submissions[0].get('feeAmount'), '');

    // Enter service charge and check live deducted hint
    fireEvent.change(feeInput, { target: { value: '18.50' } });
    assert.ok(screen.getByText('Tk 1,018.50 deducted from bKash'));

    fireEvent.click(screen.getByRole('button', { name: 'Transfer' }));
    assert.equal(submissions.length, 2);
    assert.equal(submissions[1].get('feeAmount'), '18.50');

    // Edit mode pre-fills existing transfer cleanly
    rerender(
      <CurrencyProvider symbol="Tk">
        <TransferForm
          key={sampleTransfers[0].id}
          accounts={sampleAccounts}
          initialTransfer={sampleTransfers[0]}
          isPending={false}
          onSubmit={(fd) => submissions.push(fd)}
        />
      </CurrencyProvider>
    );

    assert.ok(screen.getByText('Tk 1,018.50 deducted from bKash'));
    fireEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    assert.equal(submissions.length, 3);
    assert.equal(submissions[2].get('id'), 'tr-1');
    assert.equal(submissions[2].get('amount'), '1000');
    assert.equal(submissions[2].get('feeAmount'), '18.5');
    assert.equal(submissions[2].get('description'), 'Cash out');
  });

  it('prevents self-transfers, supports swapping accounts, and shows available balance hints in TransferForm', () => {
    const submissions: FormData[] = [];
    render(
      <CurrencyProvider symbol="Tk">
        <TransferForm
          accounts={sampleAccounts}
          isPending={false}
          onSubmit={(fd) => submissions.push(fd)}
        />
      </CurrencyProvider>
    );

    const [fromBox, toBox] = screen.getAllByPlaceholderText('Select account') as HTMLInputElement[];
    fireEvent.focus(fromBox);
    fireEvent.mouseDown(screen.getByRole('option', { name: /bKash/ }));
    assert.ok(screen.getByText('Available Tk 2,481.50'));

    // bKash should not be selectable in To when already selected as From
    fireEvent.focus(toBox);
    assert.equal(screen.queryByRole('option', { name: /bKash/ }), null);
    fireEvent.mouseDown(screen.getByRole('option', { name: /Cash/ }));

    // Swap accounts reverses From and To cleanly
    fireEvent.click(screen.getByRole('button', { name: 'Swap accounts' }));
    assert.equal(fromBox.value, 'Cash');
    assert.equal(toBox.value, 'bKash');
    assert.ok(screen.getByText('Available Tk 1,300.00'));
  });

  it('explains needing two accounts when fewer than two accounts exist', () => {
    render(
      <CurrencyProvider symbol="Tk">
        <TransferForm
          accounts={[sampleAccounts[0]]}
          isPending={false}
          onSubmit={() => {}}
        />
      </CurrencyProvider>
    );

    assert.ok(screen.getByText(/Add at least two accounts/i));
    const submitBtn = screen.getByRole('button', { name: 'Transfer' }) as HTMLButtonElement;
    assert.equal(submitBtn.disabled, true);
  });
});
