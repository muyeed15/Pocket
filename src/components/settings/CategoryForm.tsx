'use client';

import React, { useMemo, useState } from 'react';
import { FLOW_TYPE_LABELS } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox';
import { Field, fieldClass } from '@/components/ui/Field';
import type {
  BudgetGroupSettingRow,
  CategorySettingRow,
  FlowType,
  SavingsFundSettingRow,
} from '@/types/ledger';

interface CategoryFormProps {
  budgetGroups: BudgetGroupSettingRow[];
  savingsFunds: SavingsFundSettingRow[];
  initialCategory?: CategorySettingRow | null;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}

const FLOW_TYPE_OPTIONS: ComboboxOption[] = (
  Object.keys(FLOW_TYPE_LABELS) as FlowType[]
).map((ft) => ({
  value: ft,
  label: FLOW_TYPE_LABELS[ft],
}));

export function CategoryForm({
  budgetGroups,
  savingsFunds,
  initialCategory,
  isPending,
  onSubmit,
}: CategoryFormProps) {
  const [flowType, setFlowType] = useState<FlowType | ''>(
    initialCategory?.flowType ?? ''
  );
  const [budgetGroupId, setBudgetGroupId] = useState(
    initialCategory?.budgetGroupId ?? ''
  );
  const [defaultSavingsFundId, setDefaultSavingsFundId] = useState(
    initialCategory?.defaultSavingsFundId ?? ''
  );

  const budgetGroupOptions: ComboboxOption[] = useMemo(
    () => budgetGroups.map((bg) => ({ value: bg.id, label: bg.name })),
    [budgetGroups]
  );

  const savingsFundOptions: ComboboxOption[] = useMemo(
    () => savingsFunds.map((sf) => ({ value: sf.id, label: sf.name })),
    [savingsFunds]
  );

  const isExpense = flowType === 'EXPENSE';
  const isSavings =
    flowType === 'SAVINGS_DEPOSIT' || flowType === 'SAVINGS_WITHDRAWAL';

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="space-y-7"
    >
      {initialCategory && (
        <input type="hidden" name="id" value={initialCategory.id} />
      )}

      <Field label="Name">
        <input
          type="text"
          name="name"
          required
          autoFocus
          defaultValue={initialCategory?.name ?? ''}
          placeholder="e.g. Groceries"
          className={fieldClass}
        />
      </Field>

      <Field label="Flow type">
        <Combobox
          name="flowType"
          required
          options={FLOW_TYPE_OPTIONS}
          value={flowType}
          onChange={(val) => setFlowType(val as FlowType | '')}
          placeholder="Select flow type"
        />
      </Field>

      {isExpense && (
        <Field label="Budget group" hint="Optional grouping for spending targets">
          <Combobox
            name="budgetGroupId"
            options={budgetGroupOptions}
            value={budgetGroupId}
            onChange={setBudgetGroupId}
            placeholder="Optional (none)"
          />
        </Field>
      )}

      {isSavings && (
        <Field label="Default savings fund">
          <Combobox
            name="defaultSavingsFundId"
            options={savingsFundOptions}
            value={defaultSavingsFundId}
            onChange={setDefaultSavingsFundId}
            placeholder="Optional (none)"
          />
        </Field>
      )}

      <Button type="submit" disabled={isPending} className="w-full">
        {initialCategory ? 'Save changes' : 'Add category'}
      </Button>
    </form>
  );
}
