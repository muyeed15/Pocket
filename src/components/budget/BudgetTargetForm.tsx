'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox';
import { Field, MoneyInput } from '@/components/ui/Field';
import type {
  BudgetGroupOption,
  BudgetItemType,
  BudgetProgressRow,
  CategoryOption,
  SavingsFundBalanceRow,
} from '@/types/ledger';

interface BudgetTargetFormProps {
  budgetMonthIso: string;
  budgetGroups: BudgetGroupOption[];
  categories: CategoryOption[];
  savingsFunds: SavingsFundBalanceRow[];
  initialItem?: BudgetProgressRow | null;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}

const TYPE_OPTIONS: ComboboxOption[] = [
  { value: 'SPENDING', label: 'Spending group' },
  { value: 'SAVINGS', label: 'Savings fund' },
  { value: 'INCOME', label: 'Income category' },
];

export function BudgetTargetForm({
  budgetMonthIso,
  budgetGroups,
  categories,
  savingsFunds,
  initialItem,
  isPending,
  onSubmit,
}: BudgetTargetFormProps) {
  const [itemType, setItemType] = useState<BudgetItemType | ''>(
    initialItem?.itemType ?? ''
  );
  const [targetId, setTargetId] = useState(initialItem?.targetId ?? '');

  const targetOptions: ComboboxOption[] = useMemo(() => {
    if (itemType === 'SPENDING') {
      return budgetGroups.map((bg) => ({ value: bg.id, label: bg.name }));
    }
    if (itemType === 'SAVINGS') {
      return savingsFunds.map((sf) => ({
        value: sf.savingsFundId,
        label: sf.savingsFundName,
      }));
    }
    if (itemType === 'INCOME') {
      return categories
        .filter((c) => c.flowType === 'INCOME')
        .map((c) => ({ value: c.id, label: c.name }));
    }
    return [];
  }, [itemType, budgetGroups, savingsFunds, categories]);

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
        <Combobox
          name="itemType"
          required
          disabled={Boolean(initialItem)}
          options={TYPE_OPTIONS}
          value={itemType}
          onChange={(val) => {
            setItemType(val as BudgetItemType | '');
            setTargetId('');
          }}
          placeholder="Select type"
        />
      </Field>

      <Field label="Target">
        <Combobox
          name="targetId"
          required
          disabled={!itemType || Boolean(initialItem)}
          options={targetOptions}
          value={targetId}
          onChange={setTargetId}
          placeholder="Select target"
        />
      </Field>

      <Field label="Monthly target">
        <MoneyInput
          name="plannedAmount"
          step="0.01"
          min="0"
          required
          defaultValue={initialItem ? initialItem.plannedAmount : ''}
          autoFocus={Boolean(initialItem)}
          placeholder="0.00"
          className="text-3xl"
        />
      </Field>

      <Button type="submit" disabled={isPending} className="w-full">
        {initialItem ? 'Update target' : 'Save target'}
      </Button>
    </form>
  );
}
