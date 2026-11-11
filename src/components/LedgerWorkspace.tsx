'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { ActiveTab, LedgerSnapshot } from '@/types/ledger';
import {
  createTransactionAction,
  deleteTransactionAction,
  createTransferAction,
  deleteTransferAction,
  upsertBudgetItemAction,
  deleteBudgetItemAction,
  updateAccountOpeningBalanceAction,
  type ActionResult,
} from '@/actions';
import { Sheet } from './ui/Sheet';
import { Toast, type ToastMessage } from './ui/Toast';
import { TopHeader } from './layout/TopHeader';
import { DashboardView } from './dashboard/DashboardView';
import { TransactionsView } from './transactions/TransactionsView';
import { TransactionForm } from './transactions/TransactionForm';
import { BudgetView } from './budget/BudgetView';
import { AccountsView } from './accounts/AccountsView';
import { YearlySummaryView } from './summary/YearlySummaryView';

export function LedgerWorkspace({ data }: { data: LedgerSnapshot }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [entryOpen, setEntryOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const currentMonthSummary =
    data.monthlySummary[data.selectedMonth - 1] ?? data.monthlySummary[0];

  function handlePeriodChange(year: number, month: number) {
    startTransition(() => {
      router.push(`/?year=${year}&month=${month}`);
    });
  }

  function runMutation(
    actionPromise: () => Promise<ActionResult>,
    successText?: string,
    onSuccess?: () => void
  ) {
    setToast(null);
    startTransition(async () => {
      const res = await actionPromise();
      if (res?.error) {
        setToast({ type: 'error', text: res.error });
      } else {
        onSuccess?.();
        if (successText) {
          setToast({ type: 'success', text: successText });
        }
      }
    });
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <TopHeader
        selectedYear={data.selectedYear}
        selectedMonth={data.selectedMonth}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onSelectPeriod={handlePeriodChange}
        onAdd={() => setEntryOpen(true)}
      />

      <main className="mx-auto max-w-6xl px-6 py-16 sm:py-20">
        {activeTab === 'overview' && (
          <DashboardView
            summary={currentMonthSummary}
            insights={data.insights}
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            selectedYear={data.selectedYear}
            selectedMonth={data.selectedMonth}
            transactions={data.transactions}
            isPending={isPending}
            onDeleteTransaction={(id) =>
              runMutation(() => deleteTransactionAction(id))
            }
          />
        )}

        {activeTab === 'budget' && (
          <BudgetView
            selectedYear={data.selectedYear}
            selectedMonth={data.selectedMonth}
            summary={currentMonthSummary}
            budgetItems={data.budgetItems}
            budgetGroups={data.budgetGroups}
            categories={data.categories}
            savingsFunds={data.savingsFunds}
            isPending={isPending}
            onUpsertBudget={(formData, onSuccess) =>
              runMutation(
                () => upsertBudgetItemAction(formData),
                'Target saved',
                onSuccess
              )
            }
            onDeleteBudgetItem={(id) =>
              runMutation(() => deleteBudgetItemAction(id))
            }
          />
        )}

        {activeTab === 'accounts' && (
          <AccountsView
            accounts={data.accounts}
            savingsFunds={data.savingsFunds}
            transfers={data.transfers}
            reconciliation={data.reconciliation}
            isPending={isPending}
            onUpdateOpeningBalance={(formData, onSuccess) =>
              runMutation(
                () => updateAccountOpeningBalanceAction(formData),
                'Opening balance updated',
                onSuccess
              )
            }
            onAddTransfer={(formData, onSuccess) =>
              runMutation(
                () => createTransferAction(formData),
                'Transfer recorded',
                onSuccess
              )
            }
            onDeleteTransfer={(id) =>
              runMutation(() => deleteTransferAction(id))
            }
          />
        )}

        {activeTab === 'summary' && (
          <YearlySummaryView
            selectedYear={data.selectedYear}
            selectedMonth={data.selectedMonth}
            monthlySummary={data.monthlySummary}
            onSelectPeriod={handlePeriodChange}
          />
        )}
      </main>

      <Sheet title="New entry" open={entryOpen} onClose={() => setEntryOpen(false)}>
        <TransactionForm
          categories={data.categories}
          accounts={data.accounts}
          savingsFunds={data.savingsFunds}
          isPending={isPending}
          onSubmit={(formData) =>
            runMutation(
              () => createTransactionAction(formData),
              'Entry saved',
              () => setEntryOpen(false)
            )
          }
        />
      </Sheet>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
