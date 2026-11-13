'use client';

import React, { useMemo, useState } from 'react';
import { FLOW_TYPE_LABELS, MONTH_NAMES } from '@/lib/constants';
import { formatTk, getMonthPrefix, round2 } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import { SearchField } from '@/components/ui/Field';
import type { FlowType, LedgerTransactionRow } from '@/types/ledger';
import { TransactionList } from './TransactionList';

type Scope = 'month' | 'all';

interface TransactionsViewProps {
  selectedYear: number;
  selectedMonth: number;
  transactions: LedgerTransactionRow[];
  isPending: boolean;
  onAddEntry?: () => void;
  onEditTransaction: (tx: LedgerTransactionRow) => void;
  onDeleteTransaction: (id: string) => void;
}

export function TransactionsView({
  selectedYear,
  selectedMonth,
  transactions,
  isPending,
  onAddEntry,
  onEditTransaction,
  onDeleteTransaction,
}: TransactionsViewProps) {
  const symbol = useCurrencySymbol();
  const [scope, setScope] = useState<Scope>('month');
  const [flow, setFlow] = useState<FlowType | 'ALL'>('ALL');
  const [query, setQuery] = useState('');

  const monthPrefix = getMonthPrefix(selectedYear, selectedMonth);

  const flowOptions: ComboboxOption[] = useMemo(
    () => [
      { value: 'ALL', label: 'All types' },
      ...(Object.keys(FLOW_TYPE_LABELS) as FlowType[]).map((ft) => ({
        value: ft,
        label: FLOW_TYPE_LABELS[ft],
      })),
    ],
    []
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((tx) => {
      if (scope === 'month' && !tx.transactionDate.startsWith(monthPrefix)) return false;
      if (flow !== 'ALL' && tx.flowType !== flow) return false;
      if (!q) return true;
      return [tx.description, tx.categoryName, tx.budgetGroupName, tx.accountName].some((text) =>
        text?.toLowerCase().includes(q)
      );
    });
  }, [transactions, scope, flow, query, monthPrefix]);

  const { totalIn, totalOut, totalNet } = useMemo(() => {
    let cashIn = 0;
    let cashOut = 0;
    for (const tx of visible) {
      if (tx.cashChange > 0) cashIn += tx.cashChange;
      else if (tx.cashChange < 0) cashOut += Math.abs(tx.cashChange);
    }
    return {
      totalIn: round2(cashIn),
      totalOut: round2(cashOut),
      totalNet: round2(cashIn - cashOut),
    };
  }, [visible]);

  const isFiltering = Boolean(query.trim()) || flow !== 'ALL';
  const monthLabel = `${MONTH_NAMES[selectedMonth - 1] ?? ''} ${selectedYear}`;
  const emptyMessage = isFiltering
    ? `No matching entries${scope === 'month' ? ` in ${monthLabel}` : ''}`
    : scope === 'month'
      ? `No entries in ${monthLabel}`
      : 'No entries recorded yet';

  const emptyAction =
    isFiltering && scope === 'month' ? (
      <Button variant="ghost" onClick={() => setScope('all')}>
        Search all time
      </Button>
    ) : !isFiltering && onAddEntry ? (
      <Button variant="ghost" onClick={onAddEntry}>
        Add entry
      </Button>
    ) : null;

  return (
    <div className="space-y-6 sm:space-y-10">
      <div className="flex flex-col gap-3 border-b border-neutral-200 pb-3 sm:flex-row sm:items-center sm:gap-8 sm:pb-4">
        <SearchField
          value={query}
          onChange={setQuery}
          label="Search transactions"
          placeholder="Search"
        />

        <div className="flex items-center justify-between gap-4 sm:justify-start sm:gap-8">
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

          <Combobox
            ariaLabel="Filter by type"
            options={flowOptions}
            value={flow}
            onChange={(val) => setFlow((val || 'ALL') as FlowType | 'ALL')}
            allowClear={flow !== 'ALL'}
            placeholder="All types"
            className="w-44"
            inputClassName="border-b-0 py-1.5 text-[15px] text-neutral-600"
          />
        </div>
      </div>

      {visible.length > 0 && (
        <div className="flex flex-wrap items-baseline justify-between gap-4 text-sm text-neutral-500">
          <span className="tabular-nums">
            {visible.length} {visible.length === 1 ? 'entry' : 'entries'}
          </span>
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
        isPending={isPending}
        emptyMessage={emptyMessage}
        emptyAction={emptyAction}
        onEdit={onEditTransaction}
        onDelete={onDeleteTransaction}
      />
    </div>
  );
}
