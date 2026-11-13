'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MONTH_NAMES, TABS } from '@/lib/constants';
import { defaultPeriodDate, getMonthPrefix } from '@/lib/format';
import type {
  ActiveTab,
  LedgerSnapshot,
  LedgerTransactionRow,
  TransferRow,
} from '@/types/ledger';
import {
  logoutAction,
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
  createTransferAction,
  updateTransferAction,
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
import type { CashFlowKey } from './dashboard/MonthFlowList';
import {
  TransactionsView,
  type FlowFilter,
} from './transactions/TransactionsView';
import { TransactionForm } from './transactions/TransactionForm';
import { BudgetView } from './budget/BudgetView';
import { AccountsView } from './accounts/AccountsView';
import { TransfersView } from './transfers/TransfersView';
import { TransferForm } from './transfers/TransferForm';
import { YearlySummaryView } from './summary/YearlySummaryView';

const FLOW_DRILLDOWN_MAP: Record<CashFlowKey, FlowFilter> = {
  income: 'INCOME',
  spending: 'EXPENSE',
  borrowed: 'BORROWING',
  debtPaid: 'DEBT_PAYMENT',
  transfersNet: 'ALL',
  transferFees: 'SERVICE_CHARGES',
  untrackedNet: 'ALL',
  saved: 'SAVINGS_DEPOSIT',
  savingsUsed: 'SAVINGS_WITHDRAWAL',
};

export function LedgerWorkspace({
  data,
  initialTab = 'overview',
}: {
  data: LedgerSnapshot;
  initialTab?: ActiveTab;
}) {
  const router = useRouter();
  const { isPending, toast, dismissToast, runAction: runMutation, startTransition } =
    useActionToast();
  const [activeTab, setActiveTab] = useState<ActiveTab>(initialTab);
  const [entryOpen, setEntryOpen] = useState(false);
  const [entryMode, setEntryMode] = useState<'entry' | 'transfer'>('entry');
  const [editingTransaction, setEditingTransaction] =
    useState<LedgerTransactionRow | null>(null);
  const [editingTransfer, setEditingTransfer] = useState<TransferRow | null>(null);
  const [ledgerPreset, setLedgerPreset] = useState<{
    key: number;
    flow: FlowFilter;
    query: string;
    accountId: string;
  }>({ key: 0, flow: 'ALL', query: '', accountId: 'ALL' });
  const [transferPreset, setTransferPreset] = useState<{
    key: number;
    accountId: string;
  }>({ key: 0, accountId: 'ALL' });

  useEffect(() => {
    function handlePopState() {
      const param = new URLSearchParams(window.location.search).get('tab');
      const next = TABS.some((t) => t.id === param)
        ? (param as ActiveTab)
        : 'overview';
      setActiveTab(next);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const currentMonthSummary =
    data.monthlySummary[data.selectedMonth - 1] ?? data.monthlySummary[0];
  const viewedMonthPrefix = getMonthPrefix(data.selectedYear, data.selectedMonth);
  const sheetOpen =
    entryOpen || editingTransaction !== null || editingTransfer !== null;
  const defaultEntryDate = sheetOpen
    ? defaultPeriodDate(data.selectedYear, data.selectedMonth)
    : undefined;

  function formatSavedMessage(baseLabel: string, rawDate: FormDataEntryValue | null) {
    const dateStr = typeof rawDate === 'string' ? rawDate.trim() : '';
    if (!dateStr || dateStr.startsWith(viewedMonthPrefix)) return baseLabel;
    const [yr, mo] = dateStr.split('-');
    const monthName = MONTH_NAMES[Number(mo) - 1];
    return monthName && yr ? `${baseLabel} · ${monthName} ${yr}` : baseLabel;
  }

  function handlePeriodChange(year: number, month: number) {
    const tabParam = activeTab !== 'overview' ? `&tab=${activeTab}` : '';
    startTransition(() => {
      router.push(`/?year=${year}&month=${month}${tabParam}`);
    });
  }

  function handleSelectTab(tab: ActiveTab) {
    if (tab === activeTab) return;
    setActiveTab(tab);
    const tabParam = tab !== 'overview' ? `&tab=${tab}` : '';
    window.history.pushState(
      null,
      '',
      `/?year=${data.selectedYear}&month=${data.selectedMonth}${tabParam}`
    );
  }

  function openLedgerWithPreset(next: {
    flow?: FlowFilter;
    query?: string;
    accountId?: string;
  }) {
    setLedgerPreset((prev) => ({
      key: prev.key + 1,
      flow: next.flow ?? 'ALL',
      query: next.query ?? '',
      accountId: next.accountId ?? 'ALL',
    }));
    handleSelectTab('transactions');
  }

  function openTransfersForAccount(accountId: string) {
    setTransferPreset((prev) => ({ key: prev.key + 1, accountId }));
    handleSelectTab('transfers');
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
            onSelectTab={handleSelectTab}
            onSelectPeriod={handlePeriodChange}
            addLabel={activeTab === 'transfers' ? 'New transfer' : 'New entry'}
            onAdd={() => {
              setEntryMode(activeTab === 'transfers' ? 'transfer' : 'entry');
              setEntryOpen(true);
            }}
            onLogout={() => startTransition(() => logoutAction())}
          />
        }
      >
        {activeTab === 'overview' && (
          <DashboardView
            summary={currentMonthSummary}
            insights={data.insights}
            onSelectFlow={(key) => {
              if (key === 'transfersNet') {
                handleSelectTab('transfers');
              } else {
                openLedgerWithPreset({ flow: FLOW_DRILLDOWN_MAP[key] });
              }
            }}
            onSelectGroup={(groupName) =>
              openLedgerWithPreset({ flow: 'EXPENSE', query: groupName })
            }
          />
        )}

        {activeTab === 'transactions' && (
          <TransactionsView
            key={ledgerPreset.key}
            selectedYear={data.selectedYear}
            selectedMonth={data.selectedMonth}
            transactions={data.transactions}
            transfers={data.transfers}
            accounts={data.accounts}
            initialFlow={ledgerPreset.flow}
            initialQuery={ledgerPreset.query}
            initialAccountFilter={ledgerPreset.accountId}
            isPending={isPending}
            onAddEntry={() => {
              setEntryMode('entry');
              setEntryOpen(true);
            }}
            onAddTransfer={() => {
              setEntryMode('transfer');
              setEntryOpen(true);
            }}
            onEditTransaction={(tx) => setEditingTransaction(tx)}
            onDeleteTransaction={(id) =>
              runMutation(() => deleteTransactionAction(id))
            }
            onEditTransfer={(tr) => setEditingTransfer(tr)}
            onDeleteTransfer={(id) =>
              runMutation(() => deleteTransferAction(id))
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
            reconciliation={data.reconciliation}
            isPending={isPending}
            onUpdateOpeningBalance={(formData, onSuccess) =>
              runMutation(
                () => updateAccountOpeningBalanceAction(formData),
                'Opening balance updated',
                onSuccess
              )
            }
            onNewTransfer={() => {
              setEntryMode('transfer');
              setEntryOpen(true);
            }}
            onOpenAccountLedger={(accountId) => openLedgerWithPreset({ accountId })}
            onOpenAccountTransfers={openTransfersForAccount}
          />
        )}

        {activeTab === 'transfers' && (
          <TransfersView
            key={transferPreset.key}
            selectedYear={data.selectedYear}
            selectedMonth={data.selectedMonth}
            accounts={data.accounts}
            transfers={data.transfers}
            initialAccountFilter={transferPreset.accountId}
            isPending={isPending}
            onAddTransfer={() => {
              setEntryMode('transfer');
              setEntryOpen(true);
            }}
            onEditTransfer={(tr) => setEditingTransfer(tr)}
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
          title={
            editingTransaction
              ? 'Edit entry'
              : editingTransfer
                ? 'Edit transfer'
                : entryMode === 'transfer'
                  ? 'New transfer'
                  : 'New entry'
          }
          open={sheetOpen}
          onClose={() => {
            setEntryOpen(false);
            setEditingTransaction(null);
            setEditingTransfer(null);
            setEntryMode('entry');
          }}
        >
          {!editingTransaction && !editingTransfer && (
            <div
              role="tablist"
              aria-label="Entry type"
              className="mb-7 flex gap-6 border-b border-neutral-200 pb-3 text-[15px]"
            >
              {(
                [
                  { id: 'entry', label: 'Entry' },
                  { id: 'transfer', label: 'Transfer' },
                ] as const
              ).map((mode) => (
                <button
                  key={mode.id}
                  type="button"
                  role="tab"
                  aria-selected={entryMode === mode.id}
                  onClick={() => setEntryMode(mode.id)}
                  className={
                    entryMode === mode.id
                      ? 'text-black'
                      : 'text-neutral-400 hover:text-black'
                  }
                >
                  {mode.label}
                </button>
              ))}
            </div>
          )}

          {editingTransfer || (!editingTransaction && entryMode === 'transfer') ? (
            <TransferForm
              key={editingTransfer?.id ?? `new-transfer-${viewedMonthPrefix}`}
              accounts={data.accounts}
              initialTransfer={editingTransfer}
              defaultDate={defaultEntryDate}
              isPending={isPending}
              onSubmit={(formData) =>
                editingTransfer
                  ? runMutation(
                      () => updateTransferAction(formData),
                      formatSavedMessage(
                        'Transfer updated',
                        formData.get('transferDate')
                      ),
                      () => setEditingTransfer(null)
                    )
                  : runMutation(
                      () => createTransferAction(formData),
                      formatSavedMessage(
                        'Transfer recorded',
                        formData.get('transferDate')
                      ),
                      () => setEntryOpen(false)
                    )
              }
            />
          ) : (
            <TransactionForm
              key={editingTransaction?.id ?? `new-${viewedMonthPrefix}`}
              categories={data.categories}
              accounts={data.accounts}
              savingsFunds={data.savingsFunds}
              initialTransaction={editingTransaction}
              defaultDate={defaultEntryDate}
              isPending={isPending}
              onSubmit={(formData) =>
                editingTransaction
                  ? runMutation(
                      () => updateTransactionAction(formData),
                      formatSavedMessage(
                        'Entry updated',
                        formData.get('transactionDate')
                      ),
                      () => setEditingTransaction(null)
                    )
                  : runMutation(
                      () => createTransactionAction(formData),
                      formatSavedMessage(
                        'Entry saved',
                        formData.get('transactionDate')
                      ),
                      () => setEntryOpen(false)
                    )
              }
            />
          )}
        </Sheet>
      </PageShell>
    </CurrencyProvider>
  );
}
