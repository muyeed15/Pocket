'use client';

import React, { useState } from 'react';
import { IoAdd, IoCreateOutline } from 'react-icons/io5';
import { formatTk, getMonthPrefix } from '@/lib/format';
import { Button, IconButton } from '@/components/ui/Button';
import {
  ConfirmDeleteButton,
  ROW_ACTIONS_CLASS,
} from '@/components/ui/ConfirmDeleteButton';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
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
  const symbol = useCurrencySymbol();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<BudgetProgressRow | null>(null);
  const budgetMonthIso = `${getMonthPrefix(selectedYear, selectedMonth)}-01`;
  const remainingSpending = summary.plannedSpending - summary.spending;

  return (
    <div className="space-y-12 sm:space-y-16">
      <div className="flex flex-wrap items-end justify-between gap-6 sm:gap-10">
        <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-10">
          <Metric
            label="Planned spending"
            value={formatTk(summary.plannedSpending, { symbol })}
            detail={
              summary.plannedSpending === 0
                ? `${formatTk(summary.spending, { symbol })} spent`
                : remainingSpending >= 0
                  ? `${formatTk(remainingSpending, { symbol })} left`
                  : `${formatTk(Math.abs(remainingSpending), { symbol })} over`
            }
          />
          <Metric
            label="Planned savings"
            value={formatTk(summary.plannedSavings, { symbol })}
            detail={`${formatTk(summary.saved, { symbol })} saved`}
          />
          <div className="col-span-2 sm:col-span-1">
            <Metric
              label="Planned income"
              value={formatTk(summary.plannedIncome, { symbol })}
              detail={`${formatTk(summary.income, { symbol })} earned`}
            />
          </div>
        </div>

        <Button
          onClick={() => {
            setEditingItem(null);
            setSheetOpen(true);
          }}
        >
          <IoAdd className="text-lg" />
          Set target
        </Button>
      </div>

      <div className="space-y-12 sm:space-y-14">
        {GROUPS.map(({ type, title }) => {
          const items = budgetItems.filter((b) => b.itemType === type);
          return (
            <Section key={type} title={title}>
              {items.length === 0 ? (
                <EmptyState className="py-5 sm:py-6">No targets set</EmptyState>
              ) : (
                <ul className="space-y-7">
                  {items.map((item) => {
                    const over = item.actualAmount > item.plannedAmount;
                    return (
                      <li key={item.id} className="group space-y-2.5">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                          <span className="text-[18px]">{item.targetName}</span>
                          <div className="flex basis-full items-center justify-between gap-2 sm:basis-auto sm:justify-end">
                            <span
                              className={`whitespace-nowrap tabular-nums ${
                                over ? 'text-black underline underline-offset-4' : 'text-neutral-500'
                              }`}
                            >
                              {formatTk(item.actualAmount, { symbol })} of {formatTk(item.plannedAmount, { symbol })}
                            </span>
                            <div className={ROW_ACTIONS_CLASS}>
                              <IconButton
                                label="Edit target"
                                disabled={isPending}
                                onClick={() => {
                                  setEditingItem(item);
                                  setSheetOpen(true);
                                }}
                              >
                                <IoCreateOutline />
                              </IconButton>
                              <ConfirmDeleteButton
                                label="Remove target"
                                confirmLabel="Confirm remove target"
                                disabled={isPending}
                                onConfirm={() => onDeleteBudgetItem(item.id)}
                              />
                            </div>
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

      <Sheet
        title={editingItem ? 'Edit monthly target' : 'Monthly target'}
        open={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditingItem(null);
        }}
      >
        <BudgetTargetForm
          key={editingItem?.id ?? 'new-target'}
          budgetMonthIso={budgetMonthIso}
          budgetGroups={budgetGroups}
          categories={categories}
          savingsFunds={savingsFunds}
          initialItem={editingItem}
          isPending={isPending}
          onSubmit={(fd) =>
            onUpsertBudget(fd, () => {
              setSheetOpen(false);
              setEditingItem(null);
            })
          }
        />
      </Sheet>
    </div>
  );
}
