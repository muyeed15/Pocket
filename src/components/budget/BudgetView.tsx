'use client';

import React, { useState } from 'react';
import { IoAdd, IoTrashOutline } from 'react-icons/io5';
import { formatTk, getMonthPrefix } from '@/lib/format';
import { Button, IconButton } from '@/components/ui/Button';
import { Metric } from '@/components/ui/Metric';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState, Section } from '@/components/ui/Section';
import { Sheet } from '@/components/ui/Sheet';
import type {
  BudgetGroupOption,
  BudgetItemType,
  BudgetProgressRow,
  CategoryOption,
  MonthlySummaryRow,
  SavingsFundBalanceRow,
} from '@/types/ledger';
import { BudgetTargetForm } from './BudgetTargetForm';

interface BudgetViewProps {
  selectedYear: number;
  selectedMonth: number;
  summary: MonthlySummaryRow;
  budgetItems: BudgetProgressRow[];
  budgetGroups: BudgetGroupOption[];
  categories: CategoryOption[];
  savingsFunds: SavingsFundBalanceRow[];
  isPending: boolean;
  onUpsertBudget: (formData: FormData, onSuccess: () => void) => void;
  onDeleteBudgetItem: (id: string) => void;
}

const GROUPS: Array<{ type: BudgetItemType; title: string }> = [
  { type: 'SPENDING', title: 'Spending' },
  { type: 'SAVINGS', title: 'Savings' },
  { type: 'INCOME', title: 'Income' },
];

export function BudgetView({
  selectedYear,
  selectedMonth,
  summary,
  budgetItems,
  budgetGroups,
  categories,
  savingsFunds,
  isPending,
  onUpsertBudget,
  onDeleteBudgetItem,
}: BudgetViewProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const budgetMonthIso = `${getMonthPrefix(selectedYear, selectedMonth)}-01`;
  const remainingSpending = summary.plannedSpending - summary.spending;

  return (
    <div className="space-y-20">
      <div className="flex flex-wrap items-end justify-between gap-10">
        <div className="grid flex-1 gap-10 sm:grid-cols-3">
          <Metric
            label="Planned spending"
            value={formatTk(summary.plannedSpending)}
            detail={`${formatTk(remainingSpending)} remaining`}
          />
          <Metric
            label="Planned savings"
            value={formatTk(summary.plannedSavings)}
            detail={`${formatTk(summary.saved)} saved`}
          />
          <Metric
            label="Planned income"
            value={formatTk(summary.plannedIncome)}
            detail={`${formatTk(summary.income)} received`}
          />
        </div>

        <Button onClick={() => setSheetOpen(true)}>
          <IoAdd className="text-lg" />
          Set target
        </Button>
      </div>

      <div className="space-y-16">
        {GROUPS.map(({ type, title }) => {
          const items = budgetItems.filter((b) => b.itemType === type);
          return (
            <Section key={type} title={title}>
              {items.length === 0 ? (
                <EmptyState>No targets set</EmptyState>
              ) : (
                <ul className="space-y-7">
                  {items.map((item) => {
                    const over = item.actualAmount > item.plannedAmount;
                    return (
                      <li key={item.id} className="group space-y-2.5">
                        <div className="flex items-baseline justify-between gap-4">
                          <span className="text-[18px]">{item.targetName}</span>
                          <div className="flex items-center gap-3">
                            <span
                              className={`tabular-nums ${
                                over ? 'text-black underline underline-offset-4' : 'text-neutral-500'
                              }`}
                            >
                              {formatTk(item.actualAmount)} of {formatTk(item.plannedAmount)}
                            </span>
                            <IconButton
                              label="Remove target"
                              disabled={isPending}
                              onClick={() => onDeleteBudgetItem(item.id)}
                              className="sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                            >
                              <IoTrashOutline />
                            </IconButton>
                          </div>
                        </div>
                        <ProgressBar value={item.actualAmount} target={item.plannedAmount} />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
          );
        })}
      </div>

      <Sheet title="Monthly target" open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <BudgetTargetForm
          budgetMonthIso={budgetMonthIso}
          budgetGroups={budgetGroups}
          categories={categories}
          savingsFunds={savingsFunds}
          isPending={isPending}
          onSubmit={(fd) => onUpsertBudget(fd, () => setSheetOpen(false))}
        />
      </Sheet>
    </div>
  );
}
