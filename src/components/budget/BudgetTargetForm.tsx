'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, fieldClass } from '@/components/ui/Field';
import type {
  BudgetGroupOption,
  BudgetItemType,
  CategoryOption,
  SavingsFundBalanceRow,
} from '@/types/ledger';

interface BudgetTargetFormProps {
  budgetMonthIso: string;
  budgetGroups: BudgetGroupOption[];
  categories: CategoryOption[];
  savingsFunds: SavingsFundBalanceRow[];
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}

export function BudgetTargetForm({
  budgetMonthIso,
  budgetGroups,
  categories,
  savingsFunds,
  isPending,
  onSubmit,
}: BudgetTargetFormProps) {
  const [itemType, setItemType] = useState<BudgetItemType>('SPENDING');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="space-y-7"
    >
      <input type="hidden" name="budgetMonth" value={budgetMonthIso} />

      <Field label="Type">
        <select
          name="itemType"
          value={itemType}
          onChange={(e) => setItemType(e.target.value as BudgetItemType)}
          className={fieldClass}
        >
          <option value="SPENDING">Spending group</option>
          <option value="SAVINGS">Savings fund</option>
          <option value="INCOME">Income category</option>
        </select>
      </Field>

      <Field label="Target">
        <select name="targetId" required className={fieldClass}>
          {itemType === 'SPENDING' &&
            budgetGroups.map((bg) => (
              <option key={bg.id} value={bg.id}>
                {bg.name}
              </option>
            ))}
          {itemType === 'SAVINGS' &&
            savingsFunds.map((sf) => (
              <option key={sf.savingsFundId} value={sf.savingsFundId}>
                {sf.savingsFundName}
              </option>
            ))}
          {itemType === 'INCOME' &&
            categories
              .filter((c) => c.flowType === 'INCOME')
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
        </select>
      </Field>

      <Field label="Monthly target">
        <input
          type="number"
          name="plannedAmount"
          step="0.01"
          min="0"
          required
          autoFocus
          placeholder="0.00"
          className={`${fieldClass} text-3xl tabular-nums`}
        />
      </Field>

      <Button type="submit" disabled={isPending} className="w-full">
        Save target
      </Button>
    </form>
  );
}
