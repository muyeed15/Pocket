'use client';

import React from 'react';
import { formatTk, round2 } from '@/lib/format';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/Section';
import type { GroupSpending } from '@/types/ledger';

export function SpendingByGroup({ groups, limit = 6 }: { groups: GroupSpending[]; limit?: number }) {
  const symbol = useCurrencySymbol();
  if (groups.length === 0) return <EmptyState>No spending recorded yet</EmptyState>;

  const top = groups.slice(0, limit);
  const max = top[0].amount;
  const total = round2(groups.reduce((sum, g) => sum + g.amount, 0));

  return (
    <ul className="space-y-6">
      {top.map((group) => {
        const share = total > 0 ? Math.round((group.amount / total) * 100) : 0;
        return (
          <li key={group.name} className="space-y-2">
            <div className="flex items-baseline justify-between gap-4">
              <span className="truncate text-[17px]">{group.name}</span>
              <span className="shrink-0 tabular-nums text-neutral-500">
                <span className="mr-2 text-xs text-neutral-400">{share}%</span>
                {formatTk(group.amount, { symbol })}
              </span>
            </div>
            <ProgressBar value={group.amount} target={max} />
          </li>
        );
      })}
    </ul>
  );
}
