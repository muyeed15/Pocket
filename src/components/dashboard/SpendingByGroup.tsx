'use client';

import React from 'react';
import { IoChevronForward } from 'react-icons/io5';
import { formatTk, round2 } from '@/lib/format';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/Section';
import type { GroupSpending } from '@/types/ledger';

export function SpendingByGroup({
  groups,
  limit = 6,
  onSelectGroup,
}: {
  groups: GroupSpending[];
  limit?: number;
  onSelectGroup?: (groupName: string) => void;
}) {
  const symbol = useCurrencySymbol();
  if (groups.length === 0) return <EmptyState>No spending recorded yet</EmptyState>;

  const top = groups.slice(0, limit);
  const max = top[0].amount;
  const total = round2(groups.reduce((sum, g) => sum + g.amount, 0));

  return (
    <ul className="space-y-4">
      {top.map((group) => {
        const share = total > 0 ? Math.round((group.amount / total) * 100) : 0;
        const inner = (
          <>
            <div className="flex items-baseline justify-between gap-4">
              <span className="inline-flex min-w-0 items-center gap-1.5 truncate text-[17px]">
                <span className="truncate">{group.name}</span>
                {onSelectGroup && (
                  <IoChevronForward className="shrink-0 text-xs text-neutral-400 opacity-50 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" />
                )}
              </span>
              <span className="shrink-0 tabular-nums text-neutral-500">
                <span className="mr-2 text-xs text-neutral-400">{share}%</span>
                {formatTk(group.amount, { symbol })}
              </span>
            </div>
            <ProgressBar value={group.amount} target={max} />
          </>
        );

        return (
          <li key={group.name}>
            {onSelectGroup ? (
              <button
                type="button"
                onClick={() => onSelectGroup(group.name)}
                className="group -mx-2 block w-[calc(100%+1rem)] space-y-2 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-neutral-50"
              >
                {inner}
              </button>
            ) : (
              <div className="space-y-2 py-1">{inner}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
