'use client';

import React, { useMemo } from 'react';
import { IoCreateOutline } from 'react-icons/io5';
import { formatDayLabel, formatTk, round2 } from '@/lib/format';
import { IconButton } from '@/components/ui/Button';
import {
  ConfirmDeleteButton,
  ROW_ACTIONS_CLASS,
} from '@/components/ui/ConfirmDeleteButton';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import { EmptyState } from '@/components/ui/Section';
import { TransferRowItem } from '@/components/transfers/TransferRowItem';
import type { LedgerTransactionRow, TransferRow } from '@/types/ledger';

interface TransactionListProps {
  transactions: LedgerTransactionRow[];
  transfers?: TransferRow[];
  isPending: boolean;
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
  onEdit: (tx: LedgerTransactionRow) => void;
  onDelete: (id: string) => void;
  onEditTransfer?: (tr: TransferRow) => void;
  onDeleteTransfer?: (id: string) => void;
}

type DayEntry =
  | { kind: 'transaction'; tx: LedgerTransactionRow }
  | { kind: 'transfer'; tr: TransferRow };

export function TransactionList({
  transactions,
  transfers = [],
  isPending,
  emptyMessage = 'Nothing here',
  emptyAction,
  onEdit,
  onDelete,
  onEditTransfer,
  onDeleteTransfer,
}: TransactionListProps) {
  const symbol = useCurrencySymbol();
  const days = useMemo(() => {
    const groups = new Map<string, { items: DayEntry[]; net: number }>();
    for (const tx of transactions) {
      const group = groups.get(tx.transactionDate) ?? { items: [], net: 0 };
      group.items.push({ kind: 'transaction', tx });
      group.net += tx.cashChange;
      groups.set(tx.transactionDate, group);
    }
    for (const tr of transfers) {
      if (tr.feeAmount <= 0) continue;
      const group = groups.get(tr.transferDate) ?? { items: [], net: 0 };
      group.items.push({ kind: 'transfer', tr });
      group.net -= tr.feeAmount;
      groups.set(tr.transferDate, group);
    }
    return [...groups.entries()].sort(([dateA], [dateB]) =>
      dateB.localeCompare(dateA)
    );
  }, [transactions, transfers]);

  if (days.length === 0) {
    return (
      <EmptyState>
        <p>{emptyMessage}</p>
        {emptyAction && <div className="mt-3">{emptyAction}</div>}
      </EmptyState>
    );
  }

  return (
    <div className="space-y-12 sm:space-y-14">
      {days.map(([date, group]) => (
        <section key={date}>
          <div className="flex items-baseline justify-between border-b border-neutral-200 pb-2 text-sm text-neutral-500 sm:pr-[104px]">
            <h3>{formatDayLabel(date)}</h3>
            <span className="whitespace-nowrap tabular-nums">
              {formatTk(round2(group.net), { showSign: true, symbol })}
            </span>
          </div>
          <ul className="divide-y divide-neutral-100">
            {group.items.map((item) => {
              if (item.kind === 'transfer') {
                const { tr } = item;
                return (
                  <TransferRowItem
                    key={`transfer-${tr.id}`}
                    transfer={tr}
                    variant="charge"
                    isPending={isPending}
                    onEdit={onEditTransfer}
                    onDelete={onDeleteTransfer}
                  />
                );
              }

              const { tx } = item;
              const title = tx.description || tx.categoryName;
              const hasDistinctDescription =
                Boolean(tx.description?.trim()) &&
                tx.description?.trim().toLowerCase() !==
                  tx.categoryName.trim().toLowerCase();
              const subtitle = [
                hasDistinctDescription ? tx.categoryName : null,
                tx.accountName,
                tx.savingsFundName,
              ]
                .filter(Boolean)
                .join(' · ');

              return (
                <li key={tx.id} className="group flex items-center gap-3 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[17px]">{title}</p>
                    {subtitle && (
                      <p className="truncate text-sm text-neutral-500">{subtitle}</p>
                    )}
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-[17px] tabular-nums">
                    {formatTk(tx.cashChange, { showSign: true, symbol })}
                  </span>
                  <div className={ROW_ACTIONS_CLASS}>
                    <IconButton
                      label="Edit"
                      disabled={isPending}
                      onClick={() => onEdit(tx)}
                    >
                      <IoCreateOutline />
                    </IconButton>
                    <ConfirmDeleteButton
                      label="Delete"
                      disabled={isPending}
                      onConfirm={() => onDelete(tx.id)}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
