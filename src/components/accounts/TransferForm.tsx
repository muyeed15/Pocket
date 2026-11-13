'use client';

import React, { useMemo, useState } from 'react';
import { ACCOUNT_TYPE_LABELS } from '@/lib/constants';
import { todayLocalIso } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox';
import { Field, fieldClass, MoneyInput } from '@/components/ui/Field';
import type { AccountBalanceRow } from '@/types/ledger';

interface TransferFormProps {
  accounts: AccountBalanceRow[];
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}

export function TransferForm({ accounts, isPending, onSubmit }: TransferFormProps) {
  const [fromAccountId, setFromAccountId] = useState('');
  const [toAccountId, setToAccountId] = useState('');

  const accountOptions: ComboboxOption[] = useMemo(
    () =>
      accounts.map((a) => ({
        value: a.accountId,
        label: a.accountName,
        hint: ACCOUNT_TYPE_LABELS[a.accountType],
      })),
    [accounts]
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="space-y-7"
    >
      <Field label="Amount">
        <MoneyInput
          name="amount"
          step="0.01"
          min="0.01"
          required
          autoFocus
          placeholder="0.00"
          className="text-4xl"
        />
      </Field>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="From">
          <Combobox
            name="fromAccountId"
            required
            options={accountOptions}
            value={fromAccountId}
            onChange={setFromAccountId}
            placeholder="Select account"
          />
        </Field>

        <Field label="To">
          <Combobox
            name="toAccountId"
            required
            options={accountOptions}
            value={toAccountId}
            onChange={setToAccountId}
            placeholder="Select account"
          />
        </Field>
      </div>

      <Field label="Date">
        <input
          type="date"
          name="transferDate"
          defaultValue={todayLocalIso()}
          required
          className={fieldClass}
        />
      </Field>

      <Field label="Note">
        <input type="text" name="description" placeholder="Optional" className={fieldClass} />
      </Field>

      <Button type="submit" disabled={isPending} className="w-full">
        Transfer
      </Button>
    </form>
  );
}
