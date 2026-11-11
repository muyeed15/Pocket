'use client';

import React from 'react';
import { todayLocalIso } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Field, fieldClass } from '@/components/ui/Field';
import type { AccountBalanceRow } from '@/types/ledger';

interface TransferFormProps {
  accounts: AccountBalanceRow[];
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}

export function TransferForm({ accounts, isPending, onSubmit }: TransferFormProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="space-y-7"
    >
      <Field label="Amount">
        <input
          type="number"
          name="amount"
          step="0.01"
          min="0.01"
          required
          autoFocus
          placeholder="0.00"
          className={`${fieldClass} text-4xl tabular-nums`}
        />
      </Field>

      <div className="grid grid-cols-2 gap-6">
        <Field label="From">
          <select
            name="fromAccountId"
            defaultValue={accounts[2]?.accountId ?? accounts[0]?.accountId}
            className={fieldClass}
          >
            {accounts.map((a) => (
              <option key={a.accountId} value={a.accountId}>
                {a.accountName}
              </option>
            ))}
          </select>
        </Field>

        <Field label="To">
          <select
            name="toAccountId"
            defaultValue={accounts[0]?.accountId}
            className={fieldClass}
          >
            {accounts.map((a) => (
              <option key={a.accountId} value={a.accountId}>
                {a.accountName}
              </option>
            ))}
          </select>
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
