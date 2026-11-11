import React from 'react';
import { formatTk } from '@/lib/format';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState } from '@/components/ui/Section';
import type { GroupSpending } from '@/types/ledger';

export function SpendingByGroup({ groups, limit = 6 }: { groups: GroupSpending[]; limit?: number }) {
  if (groups.length === 0) return <EmptyState>No spending yet</EmptyState>;

  const top = groups.slice(0, limit);
  const max = top[0].amount;

  return (
    <ul className="space-y-6">
      {top.map((group) => (
        <li key={group.name} className="space-y-2">
          <div className="flex items-baseline justify-between gap-4">
            <span className="truncate text-[17px]">{group.name}</span>
            <span className="tabular-nums text-neutral-500">{formatTk(group.amount)}</span>
          </div>
          <ProgressBar value={group.amount} target={max} />
        </li>
      ))}
    </ul>
  );
}
