'use client';

import React, { useMemo, useState } from 'react';
import { ACCOUNT_TYPE_LABELS, FLOW_TYPE_LABELS, MONTH_NAMES } from '@/lib/constants';
import { formatTk, getMonthPrefix, round2 } from '@/lib/format';
import { filterTransfers, isServiceChargeTransaction } from '@/lib/summary';
import { Button } from '@/components/ui/Button';
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import { SearchField } from '@/components/ui/Field';
import type {
  AccountBalanceRow,
  FlowType,
  LedgerTransactionRow,
  TransferRow,
} from '@/types/ledger';
import { TransactionList } from './TransactionList';

type Scope = 'month' | 'all';
export type FlowFilter = FlowType | 'ALL' | 'SERVICE_CHARGES';

interface TransactionsViewProps {
  selectedYear: number;
  selectedMonth: number;
  transactions: LedgerTransactionRow[];
  transfers?: TransferRow[];
  accounts?: AccountBalanceRow[];
  initialFlow?: FlowFilter;
  initialQuery?: string;
  initialAccountFilter?: string;
  isPending: boolean;
  onAddEntry?: () => void;
  onAddTransfer?: () => void;
  onEditTransaction: (tx: LedgerTransactionRow) => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransfer?: (tr: TransferRow) => void;
  onDeleteTransfer?: (id: string) => void;
}

export function TransactionsView({
  selectedYear,
  selectedMonth,
  transactions,
  transfers = [],
  accounts = [],
  initialFlow = 'ALL',
  initialQuery = '',
  initialAccountFilter = 'ALL',
  isPending,
  onAddEntry,
  onAddTransfer,
  onEditTransaction,
  onDeleteTransaction,
  onEditTransfer,
  onDeleteTransfer,
}: TransactionsViewProps) {
  const symbol = useCurrencySymbol();
  const [scope, setScope] = useState<Scope>('month');
  const [flow, setFlow] = useState<FlowFilter>(initialFlow);
  const [accountFilter, setAccountFilter] = useState<string>(initialAccountFilter);
  const [query, setQuery] = useState(initialQuery);

  const monthPrefix = getMonthPrefix(selectedYear, selectedMonth);

  const flowOptions: ComboboxOption[] = useMemo(
    () => [
      { value: 'ALL', label: 'All types' },
      { value: 'SERVICE_CHARGES', label: 'Service charges' },
      ...(Object.keys(FLOW_TYPE_LABELS) as FlowType[]).map((ft) => ({
        value: ft,
        label: FLOW_TYPE_LABELS[ft],
      })),
    ],
    []
  );

  const accountOptions: ComboboxOption[] = useMemo(
    () => [
      { value: 'ALL', label: 'All accounts' },
      ...accounts.map((a) => ({
        value: a.accountId,
        label: a.accountName,
        hint: ACCOUNT_TYPE_LABELS[a.accountType],
      })),
    ],
    [accounts]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (scope === 'month' && !tx.transactionDate.startsWith(monthPrefix)) return false;
      if (accountFilter !== 'ALL' && tx.accountId !== accountFilter) return false;
      if (flow === 'SERVICE_CHARGES') {
        if (!isServiceChargeTransaction(tx)) return false;
      } else if (flow !== 'ALL' && tx.flowType !== flow) {
        return false;
      }
      if (!q) return true;
      return [
        tx.description,
        tx.categoryName,
        tx.budgetGroupName,
        tx.accountName,
        isServiceChargeTransaction(tx) ? 'service charge' : null,
      ].some((text) => text?.toLowerCase().includes(q));
    });
  }, [transactions, scope, accountFilter, flow, query, monthPrefix]);

  const visibleCharges = useMemo(() => {
    if (flow !== 'ALL' && flow !== 'SERVICE_CHARGES') return [];
    const charges = filterTransfers({
      transfers,
      scope,
      monthPrefix,
      chargesOnly: true,
      query,
    });
    if (accountFilter === 'ALL') return charges;
    // Service charge cash-out belongs to the sender account.
    return charges.filter((tr) => tr.fromAccountId === accountFilter);
  }, [transfers, scope, accountFilter, flow, query, monthPrefix]);

  const { totalIn, totalOut, totalNet } = useMemo(() => {
    let cashIn = 0;
    let cashOut = 0;
    for (const tx of visible) {
      if (tx.cashChange > 0) cashIn += tx.cashChange;
      else if (tx.cashChange < 0) cashOut += Math.abs(tx.cashChange);
    }
    for (const tr of visibleCharges) {
      cashOut += tr.feeAmount;
    }
    return {
      totalIn: round2(cashIn),
      totalOut: round2(cashOut),
      totalNet: round2(cashIn - cashOut),
    };
  }, [visible, visibleCharges]);

  const visibleCount = visible.length + visibleCharges.length;
  const hasSearch = Boolean(query.trim());
  const isFiltering = hasSearch || flow !== 'ALL' || accountFilter !== 'ALL';
  const monthLabel = `${MONTH_NAMES[selectedMonth - 1] ?? ''} ${selectedYear}`;
  const emptyMessage =
    flow === 'SERVICE_CHARGES' && !hasSearch && accountFilter === 'ALL'
      ? scope === 'month'
        ? `No service charges in ${monthLabel}`
        : 'No service charges recorded yet'
      : isFiltering
        ? `No matching entries${scope === 'month' ? ` in ${monthLabel}` : ''}`
        : scope === 'month'
          ? `No entries in ${monthLabel}`
          : 'No entries recorded yet';

  function clearFilters() {
    setQuery('');
    setFlow('ALL');
    setAccountFilter('ALL');
  }

  const hasAnyHistory =
    transactions.length > 0 || transfers.some((tr) => tr.feeAmount > 0);
  const emptyAction = isFiltering ? (
    <div className="flex flex-wrap items-center justify-center gap-3">
      {scope === 'month' && (
        <Button variant="ghost" onClick={() => setScope('all')}>
          Search all time
        </Button>
      )}
      <Button variant="ghost" onClick={clearFilters}>
        Clear filters
      </Button>
      {flow === 'SERVICE_CHARGES' && !hasSearch && onAddTransfer && (
        <Button variant="ghost" onClick={onAddTransfer}>
          New transfer
        </Button>
      )}
    </div>
  ) : scope === 'month' && hasAnyHistory ? (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <Button variant="ghost" onClick={() => setScope('all')}>
        Search all time
      </Button>
      {onAddEntry && (
        <Button variant="ghost" onClick={onAddEntry}>
          Add entry
        </Button>
      )}
    </div>
  ) : onAddEntry ? (
    <Button variant="ghost" onClick={onAddEntry}>
      Add entry
    </Button>
  ) : null;

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="flex flex-col gap-3 border-b border-neutral-200 pb-3 lg:flex-row lg:items-center lg:gap-8 lg:pb-4">
        <SearchField
          value={query}
          onChange={setQuery}
          label="Search transactions"
          placeholder="Search"
        />

        <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-start sm:gap-7">
          <div className="flex gap-6 text-[15px]">
            {(['month', 'all'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setScope(value)}
                className={scope === value ? 'text-black' : 'text-neutral-400 hover:text-black'}
              >
                {value === 'month' ? 'This month' : 'All time'}
              </button>
            ))}
          </div>

          <div className="flex w-full min-w-0 items-center gap-4 sm:w-auto sm:gap-7">
            <Combobox
              ariaLabel="Filter by type"
              options={flowOptions}
              value={flow}
              onChange={(val) => setFlow((val || 'ALL') as FlowFilter)}
              allowClear={flow !== 'ALL'}
              placeholder="All types"
              className="min-w-0 flex-1 sm:w-44 sm:flex-none"
              inputClassName="border-b-0 py-1.5 text-[15px] text-neutral-600"
            />

            {accounts.length > 0 && (
              <Combobox
                ariaLabel="Filter by account"
                options={accountOptions}
                value={accountFilter}
                onChange={(val) => setAccountFilter(val || 'ALL')}
                allowClear={accountFilter !== 'ALL'}
                placeholder="All accounts"
                className="min-w-0 flex-1 sm:w-44 sm:flex-none"
                inputClassName="border-b-0 py-1.5 text-[15px] text-neutral-600"
              />
            )}
          </div>
        </div>
      </div>

      {visibleCount > 0 && (
        <div className="flex flex-wrap items-baseline justify-between gap-4 text-sm text-neutral-500">
          <div className="flex items-baseline gap-4">
            <span className="tabular-nums">
              {visibleCount} {visibleCount === 1 ? 'entry' : 'entries'}
            </span>
            {isFiltering && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-neutral-400 transition-colors hover:text-black"
              >
                Clear filters
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-1 tabular-nums">
            {totalIn > 0 && <span>+{formatTk(totalIn, { symbol })} in</span>}
            {totalOut > 0 && <span>-{formatTk(totalOut, { symbol })} out</span>}
            <span className="text-black">
              Net {formatTk(totalNet, { showSign: true, symbol })}
            </span>
          </div>
        </div>
      )}

      <TransactionList
        transactions={visible}
        transfers={visibleCharges}
        isPending={isPending}
        emptyMessage={emptyMessage}
        emptyAction={emptyAction}
        onEdit={onEditTransaction}
        onDelete={onDeleteTransaction}
        onEditTransfer={onEditTransfer}
        onDeleteTransfer={onDeleteTransfer}
      />
    </div>
  );
}
