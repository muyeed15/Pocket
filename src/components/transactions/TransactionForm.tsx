'use client';

import React, { useMemo, useState } from 'react';
import { FLOW_TYPE_LABELS } from '@/lib/constants';
import { todayLocalIso } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Field, fieldClass } from '@/components/ui/Field';
import type { AccountBalanceRow, CategoryOption, SavingsFundBalanceRow } from '@/types/ledger';

interface TransactionFormProps {
  categories: CategoryOption[];
  accounts: AccountBalanceRow[];
  savingsFunds: SavingsFundBalanceRow[];
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}

export function TransactionForm({
  categories,
  accounts,
  savingsFunds,
  isPending,
  onSubmit,
}: TransactionFormProps) {
  const [categoryId, setCategoryId] = useState(
    categories.find((c) => c.name === 'Food and drinks')?.id ?? categories[0]?.id ?? ''
  );
  const category = useMemo(
    () => categories.find((c) => c.id === categoryId),
    [categories, categoryId]
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

      <Field
        label="Category"
        hint={
          category &&
          [FLOW_TYPE_LABELS[category.flowType], category.budgetGroupName].filter(Boolean).join(', ')
        }
      >
        <select
          name="categoryId"
          required
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className={fieldClass}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <div className="grid grid-cols-2 gap-6">
        <Field label="Account">
          <select name="accountId" defaultValue={accounts[0]?.accountId} className={fieldClass}>
            {accounts.map((a) => (
              <option key={a.accountId} value={a.accountId}>
                {a.accountName}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Date">
          <input
            type="date"
            name="transactionDate"
            required
            defaultValue={todayLocalIso()}
            className={fieldClass}
          />
        </Field>
      </div>

      {isSavingsFlow && (
        <Field label="Savings fund">
          <select
            name="savingsFundId"
            defaultValue={category?.defaultSavingsFundId ?? savingsFunds[0]?.savingsFundId}
            className={fieldClass}
          >
            {savingsFunds.map((sf) => (
              <option key={sf.savingsFundId} value={sf.savingsFundId}>
                {sf.savingsFundName}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label="Note">
        <input type="text" name="description" placeholder="Optional" className={fieldClass} />
      </Field>

      <Button type="submit" disabled={isPending} className="w-full">
        Save
      </Button>
    </form>
  );
}
