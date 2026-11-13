'use client';

import React from 'react';
import { formatTk } from '@/lib/format';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import type { MonthlySummaryRow } from '@/types/ledger';

export type CashFlowTotals = Pick<
  MonthlySummaryRow,
  | 'income'
  | 'spending'
  | 'borrowed'
  | 'debtPaid'
  | 'transfersNet'
  | 'untrackedNet'
  | 'saved'
  | 'savingsUsed'
  | 'cashChange'
>;

/** Cash flow breakdown showing only lines that moved, in plain language. */
export function MonthFlowList({
  summary,
  netLabel = 'Net change',
  endingBalance,
  endingLabel = 'Cash left at end',
}: {
  summary: CashFlowTotals;
  netLabel?: string;
  endingBalance?: number;
  endingLabel?: string;
}) {
  const symbol = useCurrencySymbol();
  const rows = [
    { label: 'Income', value: summary.income },
    { label: 'Spending', value: -summary.spending },
    { label: 'Loans received', value: summary.borrowed },
    { label: 'Loans repaid', value: -summary.debtPaid },
    { label: 'Transfers', value: summary.transfersNet },
    { label: 'Adjustments', value: summary.untrackedNet },
    { label: 'Saved', value: -summary.saved },
    { label: 'Savings used', value: summary.savingsUsed },
  ].filter((row) => row.value !== 0);

  return (
    <dl className="divide-y divide-neutral-100">
      {rows.length === 0 ? (
        <div className="py-3 text-sm text-neutral-400">No cash movement yet</div>
      ) : (
        rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between py-3">
            <dt className="text-neutral-500">{row.label}</dt>
            <dd className="tabular-nums">{formatTk(row.value, { showSign: true, symbol })}</dd>
          </div>
        ))
      )}
      <div className="flex items-baseline justify-between pt-4 pb-1">
        <dt>{netLabel}</dt>
        <dd className="text-xl tabular-nums">
          {formatTk(summary.cashChange, { showSign: true, symbol })}
        </dd>
      </div>
      {endingBalance !== undefined && (
        <div className="flex items-baseline justify-between pt-3 text-sm text-neutral-500">
          <dt>{endingLabel}</dt>
          <dd className="tabular-nums text-black">{formatTk(endingBalance, { symbol })}</dd>
        </div>
      )}
    </dl>
  );
}
