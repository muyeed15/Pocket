'use client';

import React, { useMemo, useState } from 'react';
import { ACCOUNT_TYPE_LABELS, FLOW_TYPE_LABELS } from '@/lib/constants';
import { formatTk, todayLocalIso } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import { Field, fieldClass, MoneyInput } from '@/components/ui/Field';
import type {
  AccountBalanceRow,
  CategoryOption,
  LedgerTransactionRow,
  SavingsFundBalanceRow,
} from '@/types/ledger';

interface TransactionFormProps {
  categories: CategoryOption[];
  accounts: AccountBalanceRow[];
  savingsFunds: SavingsFundBalanceRow[];
  initialTransaction?: LedgerTransactionRow | null;
  defaultDate?: string;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}

export function TransactionForm({
  categories,
  accounts,
  savingsFunds,
  initialTransaction,
  defaultDate,
  isPending,
  onSubmit,
}: TransactionFormProps) {
  const symbol = useCurrencySymbol();
  const [categoryId, setCategoryId] = useState(
    initialTransaction?.categoryId ?? ''
  );
  const [accountId, setAccountId] = useState(
    initialTransaction
      ? (initialTransaction.accountId ?? '')
      : accounts.length === 1
        ? accounts[0].accountId
        : ''
  );
  const [savingsFundId, setSavingsFundId] = useState(
    initialTransaction?.savingsFundId ?? ''
  );

  function handleCategoryChange(nextCategoryId: string) {
    setCategoryId(nextCategoryId);
    const nextCat = categories.find((c) => c.id === nextCategoryId);
    if (
      nextCat &&
      (nextCat.flowType === 'SAVINGS_DEPOSIT' ||
        nextCat.flowType === 'SAVINGS_WITHDRAWAL')
    ) {
      setSavingsFundId(
        nextCat.defaultSavingsFundId ??
          (savingsFunds.length === 1 ? savingsFunds[0].savingsFundId : '')
      );
    } else {
      setSavingsFundId('');
    }
  }
  const categoryOptions: ComboboxOption[] = useMemo(
    () =>
      categories.map((c) => ({
        value: c.id,
        label: c.name,
        hint: [FLOW_TYPE_LABELS[c.flowType], c.budgetGroupName]
          .filter(Boolean)
          .join(', '),
      })),
    [categories]
  );
  const accountOptions: ComboboxOption[] = useMemo(
    () =>
      accounts.map((a) => ({
        value: a.accountId,
        label: a.accountName,
        hint: ACCOUNT_TYPE_LABELS[a.accountType],
      })),
    [accounts]
  );
  const savingsFundOptions: ComboboxOption[] = useMemo(
    () =>
      savingsFunds.map((sf) => ({
        value: sf.savingsFundId,
        label: sf.savingsFundName,
      })),
    [savingsFunds]
  );
  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
  );
  const selectedAccount = useMemo(
    () => accounts.find((a) => a.accountId === accountId),
    [accounts, accountId]
  );
  const isSavingsFlow =
    category?.flowType === 'SAVINGS_DEPOSIT' || category?.flowType === 'SAVINGS_WITHDRAWAL';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="space-y-7"
    >
      {initialTransaction && (
        <input type="hidden" name="id" value={initialTransaction.id} />
      )}

      <Field label="Amount">
        <MoneyInput
          name="amount"
          step="0.01"
          min="0.01"
          required
          autoFocus
          defaultValue={initialTransaction?.amount}
          placeholder="0.00"
          className="text-4xl"
        />
      </Field>

      <Field
        label="Category"
        hint={
          category &&
          [FLOW_TYPE_LABELS[category.flowType], category.budgetGroupName].filter(Boolean).join(', ')
        }
      >
        <Combobox
          name="categoryId"
          required
          options={categoryOptions}
          value={categoryId}
          onChange={handleCategoryChange}
          placeholder="Select or type to search"
        />
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-[1.35fr_1fr]">
        <Field
          label="Account"
          hint={
            selectedAccount
              ? `Available ${formatTk(selectedAccount.currentBalance, { symbol })}`
              : initialTransaction && !initialTransaction.accountId
                ? 'Required — assign the account used'
                : undefined
          }
        >
          <Combobox
            name="accountId"
            required
            options={accountOptions}
            value={accountId}
            onChange={setAccountId}
            placeholder="Select account"
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            name="transactionDate"
            required
            defaultValue={
              initialTransaction?.transactionDate ?? defaultDate ?? todayLocalIso()
            }
            className={fieldClass}
          />
        </Field>
      </div>

      {isSavingsFlow && (
        <Field label="Savings fund">
          <Combobox
            name="savingsFundId"
            required
            options={savingsFundOptions}
            value={savingsFundId}
            onChange={setSavingsFundId}
            placeholder="Select savings fund"
            emptyText={
              savingsFunds.length === 0
                ? 'Add a savings fund in Settings'
                : 'No matching savings funds'
            }
          />
        </Field>
      )}

      <Field label="Note">
        <input
          type="text"
          name="description"
          defaultValue={initialTransaction?.description ?? ''}
          placeholder="Optional"
          className={fieldClass}
        />
      </Field>

      <Button type="submit" disabled={isPending} className="w-full">
        {initialTransaction ? 'Save changes' : 'Save'}
      </Button>
    </form>
  );
}
