'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { ActiveTab, LedgerSnapshot, LedgerTransactionRow } from '@/types/ledger';
import {
  logoutAction,
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
  createTransferAction,
  deleteTransferAction,
  upsertBudgetItemAction,
  deleteBudgetItemAction,
  updateAccountOpeningBalanceAction,
} from '@/actions';
import { useActionToast } from '@/hooks/useActionToast';
import { PageShell } from './layout/PageShell';
import { Sheet } from './ui/Sheet';
import { CurrencyProvider } from './ui/CurrencyContext';
import { TopHeader } from './layout/TopHeader';
import { DashboardView } from './dashboard/DashboardView';
import { TransactionsView } from './transactions/TransactionsView';
import { TransactionForm } from './transactions/TransactionForm';
import { BudgetView } from './budget/BudgetView';
import { AccountsView } from './accounts/AccountsView';
import { YearlySummaryView } from './summary/YearlySummaryView';

export function LedgerWorkspace({ data }: { data: LedgerSnapshot }) {
  const router = useRouter();
  const { isPending, toast, dismissToast, runAction: runMutation, startTransition } =
    useActionToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [entryOpen, setEntryOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<LedgerTransactionRow | null>(null);

  const currentMonthSummary =
    data.monthlySummary[data.selectedMonth - 1] ?? data.monthlySummary[0];

  function handlePeriodChange(year: number, month: number) {
    startTransition(() => {
      router.push(`/?year=${year}&month=${month}`);
    });
  }

  return (
    <CurrencyProvider symbol={data.user.currencySymbol}>
      <PageShell
        toast={toast}
        onDismissToast={dismissToast}
        header={
          <TopHeader
            userName={data.user.name}
            userEmail={data.user.email}
            selectedYear={data.selectedYear}
            selectedMonth={data.selectedMonth}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            onSelectPeriod={handlePeriodChange}
            onAdd={() => setEntryOpen(true)}
            onLogout={() => startTransition(() => logoutAction())}
          />
        }
      >
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
            onAddEntry={() => setEntryOpen(true)}
            onEditTransaction={(tx) => setEditingTransaction(tx)}
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

        <Sheet
        title={editingTransaction ? 'Edit entry' : 'New entry'}
        open={entryOpen || editingTransaction !== null}
        onClose={() => {
          setEntryOpen(false);
          setEditingTransaction(null);
        }}
      >
        <TransactionForm
          key={editingTransaction?.id ?? 'new'}
          categories={data.categories}
          accounts={data.accounts}
          savingsFunds={data.savingsFunds}
          initialTransaction={editingTransaction}
          isPending={isPending}
          onSubmit={(formData) =>
            editingTransaction
              ? runMutation(
                  () => updateTransactionAction(formData),
                  'Entry updated',
                  () => setEditingTransaction(null)
                )
              : runMutation(
                  () => createTransactionAction(formData),
                  'Entry saved',
                  () => setEntryOpen(false)
                )
          }
        />
      </Sheet>
      </PageShell>
    </CurrencyProvider>
  );
}
