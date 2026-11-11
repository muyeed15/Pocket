'use client';

import React, { useMemo, useState } from 'react';
import { IoSearchOutline } from 'react-icons/io5';
import { FLOW_TYPE_LABELS } from '@/lib/constants';
import { getMonthPrefix } from '@/lib/format';
import type { FlowType, LedgerTransactionRow } from '@/types/ledger';
import { TransactionList } from './TransactionList';

type Scope = 'month' | 'all';

interface TransactionsViewProps {
  selectedYear: number;
  selectedMonth: number;
  transactions: LedgerTransactionRow[];
  isPending: boolean;
  onDeleteTransaction: (id: string) => void;
}

export function TransactionsView({
  selectedYear,
  selectedMonth,
  transactions,
  isPending,
  onDeleteTransaction,
}: TransactionsViewProps) {
  const [scope, setScope] = useState<Scope>('month');
  const [flow, setFlow] = useState<FlowType | 'ALL'>('ALL');
  const [query, setQuery] = useState('');

  const monthPrefix = getMonthPrefix(selectedYear, selectedMonth);

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

  return (
    <div className="space-y-12">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 border-b border-neutral-200 pb-4">
        <label className="relative flex min-w-56 flex-1 items-center">
          <IoSearchOutline className="pointer-events-none absolute left-0 text-lg text-neutral-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            aria-label="Search transactions"
            className="w-full bg-transparent py-2 pl-7 text-[17px] placeholder:text-neutral-300 focus:outline-none"
          />
        </label>

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

        <select
          value={flow}
          onChange={(e) => setFlow(e.target.value as FlowType | 'ALL')}
          aria-label="Filter by type"
          className="bg-transparent text-[15px] text-neutral-500 focus:outline-none"
        >
          <option value="ALL">All types</option>
          {(Object.keys(FLOW_TYPE_LABELS) as FlowType[]).map((ft) => (
            <option key={ft} value={ft}>
              {FLOW_TYPE_LABELS[ft]}
            </option>
          ))}
        </select>
      </div>

      <TransactionList
        transactions={visible}
        isPending={isPending}
        onDelete={onDeleteTransaction}
      />
    </div>
  );
}
