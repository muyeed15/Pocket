'use client';

import React, { useMemo } from 'react';
import { IoTrashOutline } from 'react-icons/io5';
import { formatDayLabel, formatTk, round2 } from '@/lib/format';
import { IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/Section';
import type { LedgerTransactionRow } from '@/types/ledger';

interface TransactionListProps {
  transactions: LedgerTransactionRow[];
  isPending: boolean;
  onDelete: (id: string) => void;
}

export function TransactionList({ transactions, isPending, onDelete }: TransactionListProps) {
  const days = useMemo(() => {
    const groups = new Map<string, { items: LedgerTransactionRow[]; net: number }>();
    for (const tx of transactions) {
      const group = groups.get(tx.transactionDate) ?? { items: [], net: 0 };
      group.items.push(tx);
      group.net += tx.cashChange;
      groups.set(tx.transactionDate, group);
    }
    return [...groups.entries()];
  }, [transactions]);

  if (days.length === 0) return <EmptyState>Nothing here</EmptyState>;

  return (
    <div className="space-y-14">
      {days.map(([date, group]) => (
        <section key={date}>
          <div className="flex items-baseline justify-between border-b border-neutral-200 pb-2 text-sm text-neutral-500">
            <h3>{formatDayLabel(date)}</h3>
            <span className="tabular-nums">{formatTk(round2(group.net), { showSign: true })}</span>
          </div>
          <ul className="divide-y divide-neutral-100">
            {group.items.map((tx) => (
              <li key={tx.id} className="group flex items-center gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[17px]">{tx.description || tx.categoryName}</p>
                  <p className="truncate text-sm text-neutral-500">
                    {[tx.categoryName, tx.accountName].filter(Boolean).join(', ')}
                  </p>
                </div>
                <span className="text-[17px] tabular-nums">
                  {formatTk(tx.cashChange, { showSign: true })}
                </span>
                <IconButton
                  label="Delete"
                  disabled={isPending}
                  onClick={() => onDelete(tx.id)}
                  className="sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                >
                  <IoTrashOutline />
                </IconButton>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
