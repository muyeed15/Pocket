import { installDom } from './setup';
installDom();

import React from 'react';
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CategoryForm } from '@/components/settings/CategoryForm';
import { SettingsView } from '@/components/settings/SettingsView';
import type { SettingsSnapshot } from '@/types/ledger';

afterEach(cleanup);

const snapshot: SettingsSnapshot = {
  user: {
    id: 'u-1',
    name: 'Syed',
    email: 'syed@example.com',
    currencyCode: 'BDT',
    currencySymbol: 'Tk',
    openingCashBalance: 1000,
    openingSavingsBalance: 500,
  },
  categories: [
    {
      id: 'c-used',
      name: 'Food and drinks',
      flowType: 'EXPENSE',
      budgetGroupId: 'bg-1',
      budgetGroupName: 'Essentials',
      defaultSavingsFundId: null,
      defaultSavingsFundName: null,
      usageCount: 3,
    },
    {
      id: 'c-unused',
      name: 'Gifts',
      flowType: 'EXPENSE',
      budgetGroupId: 'bg-1',
      budgetGroupName: 'Essentials',
      defaultSavingsFundId: null,
      defaultSavingsFundName: null,
      usageCount: 0,
    },
  ],
  budgetGroups: [{ id: 'bg-1', name: 'Essentials', sortOrder: 0, usageCount: 2 }],
  savingsFunds: [
    {
      id: 'sf-1',
      name: 'Emergency Fund',
      openingBalance: 500,
      sortOrder: 0,
      usageCount: 0,
    },
  ],
  accounts: [
    {
      id: 'a-1',
      name: 'Cash',
      type: 'CASH',
      openingBalance: 1000,
      sortOrder: 0,
      usageCount: 3,
    },
  ],
};

describe('Settings UI', () => {
  it('switches CategoryForm fields based on flow type', () => {
    render(
      <CategoryForm
        budgetGroups={snapshot.budgetGroups}
        savingsFunds={snapshot.savingsFunds}
        isPending={false}
        onSubmit={() => {}}
      />
    );

    assert.equal(screen.queryByLabelText(/Budget group/i), null);
    assert.equal(screen.queryByLabelText('Default savings fund'), null);

    const flowInput = screen.getByRole('combobox', { name: /Flow type/i });
    fireEvent.focus(flowInput);
    fireEvent.change(flowInput, { target: { value: 'Expense' } });
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Expense' }));
    assert.ok(screen.getByRole('combobox', { name: /Budget group/i }));
    assert.equal(screen.queryByRole('combobox', { name: 'Default savings fund' }), null);

    fireEvent.focus(flowInput);
    fireEvent.change(flowInput, { target: { value: 'Savings deposit' } });
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Savings deposit' }));
    assert.equal(screen.queryByRole('combobox', { name: /Budget group/i }), null);
    assert.ok(screen.getByRole('combobox', { name: 'Default savings fund' }));
  });

  it('hides delete button for in-use categories and opens Add category sheet', () => {
    render(<SettingsView data={snapshot} />);

    assert.ok(screen.getByText('In use (3)'));
    // Only 1 unused category ("Gifts") should have a Delete category button
    const deleteButtons = screen.getAllByRole('button', {
      name: 'Delete category',
    });
    assert.equal(deleteButtons.length, 1);

    fireEvent.click(screen.getByRole('button', { name: 'Add category' }));
    assert.ok(screen.getByRole('dialog', { name: 'New category' }));
  });

  it('filters categories in SettingsView via search input', () => {
    render(<SettingsView data={snapshot} />);

    assert.ok(screen.getByText('Food and drinks'));
    assert.ok(screen.getByText('Gifts'));

    fireEvent.change(screen.getByRole('searchbox', { name: 'Search categories' }), {
      target: { value: 'gift' },
    });

    assert.equal(screen.queryByText('Food and drinks'), null);
    assert.ok(screen.getByText('Gifts'));
  });
});
