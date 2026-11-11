import React from 'react';
import { formatTk } from '@/lib/format';
import type { MonthlySummaryRow } from '@/types/ledger';

/** Month cash flow, showing only the lines that actually moved. */
export function MonthFlowList({ summary }: { summary: MonthlySummaryRow }) {
  const rows = [
    { label: 'Income', value: summary.income },
    { label: 'Spending', value: -summary.spending },
    { label: 'Borrowed', value: summary.borrowed },
    { label: 'Debt repaid', value: -summary.debtPaid },
    { label: 'Transfers', value: summary.transfersNet },
    { label: 'Untracked', value: summary.untrackedNet },
    { label: 'Saved', value: -summary.saved },
    { label: 'Savings withdrawn', value: summary.savingsUsed },
  ].filter((row) => row.value !== 0);

  return (
    <dl className="divide-y divide-neutral-100">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between py-3">
          <dt className="text-neutral-500">{row.label}</dt>
          <dd className="tabular-nums">{formatTk(row.value, { showSign: true })}</dd>
        </div>
      ))}
      <div className="flex items-baseline justify-between pt-4">
        <dt>Net change</dt>
        <dd className="text-xl tabular-nums">{formatTk(summary.cashChange, { showSign: true })}</dd>
      </div>
    </dl>
  );
}
