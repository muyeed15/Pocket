'use client';

import React from 'react';
import { IoChevronForward } from 'react-icons/io5';
import { formatTk } from '@/lib/format';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import type { MonthlySummaryRow } from '@/types/ledger';

export type CashFlowKey =
  | 'income'
  | 'spending'
  | 'borrowed'
  | 'debtPaid'
  | 'transfersNet'
  | 'transferFees'
  | 'untrackedNet'
  | 'saved'
  | 'savingsUsed';

export type CashFlowTotals = Pick<MonthlySummaryRow, CashFlowKey | 'cashChange'>;

/** Cash flow breakdown showing only lines that moved, with optional drill-down. */
export function MonthFlowList({
  summary,
  netLabel = 'Net change',
  endingBalance,
  endingLabel = 'Cash left at end',
  onSelectRow,
}: {
  summary: CashFlowTotals;
  netLabel?: string;
  endingBalance?: number;
  endingLabel?: string;
  onSelectRow?: (key: CashFlowKey) => void;
}) {
  const symbol = useCurrencySymbol();
  const rows: Array<{ key: CashFlowKey; label: string; value: number }> = (
    [
      { key: 'income', label: 'Income', value: summary.income },
      { key: 'spending', label: 'Spending', value: -summary.spending },
      { key: 'borrowed', label: 'Loans received', value: summary.borrowed },
      { key: 'debtPaid', label: 'Loans repaid', value: -summary.debtPaid },
      { key: 'transfersNet', label: 'Transfers', value: summary.transfersNet },
      { key: 'transferFees', label: 'Service charges', value: -summary.transferFees },
      { key: 'untrackedNet', label: 'Adjustments', value: summary.untrackedNet },
      { key: 'saved', label: 'Saved', value: -summary.saved },
      { key: 'savingsUsed', label: 'Savings used', value: summary.savingsUsed },
    ] as const
  ).filter((row) => row.value !== 0);

  return (
    <div className="divide-y divide-neutral-100">
      {rows.length === 0 ? (
        <div className="py-3 text-sm text-neutral-400">No cash movement yet</div>
      ) : (
        rows.map((row) =>
          onSelectRow ? (
            <button
              key={row.key}
              type="button"
              onClick={() => onSelectRow(row.key)}
              className="group -mx-2 flex w-[calc(100%+1rem)] items-baseline justify-between rounded-xl px-2 py-3 text-left transition-colors hover:bg-neutral-50"
            >
              <span className="inline-flex items-center gap-1.5 text-neutral-500 transition-colors group-hover:text-black">
                {row.label}
                <IoChevronForward className="text-xs opacity-50 transition-opacity sm:opacity-0 sm:group-hover:opacity-100" />
              </span>
              <span className="tabular-nums text-black">
                {formatTk(row.value, { showSign: true, symbol })}
              </span>
            </button>
          ) : (
            <div key={row.key} className="flex items-baseline justify-between py-3">
              <span className="text-neutral-500">{row.label}</span>
              <span className="tabular-nums">
                {formatTk(row.value, { showSign: true, symbol })}
              </span>
            </div>
          )
        )
      )}
      <div className="flex items-baseline justify-between pt-4 pb-1">
        <span>{netLabel}</span>
        <span className="text-xl tabular-nums">
          {formatTk(summary.cashChange, { showSign: true, symbol })}
        </span>
      </div>
      {endingBalance !== undefined && (
        <div className="flex items-baseline justify-between pt-3 text-sm text-neutral-500">
          <span>{endingLabel}</span>
          <span className="tabular-nums text-black">
            {formatTk(endingBalance, { symbol })}
          </span>
        </div>
      )}
    </div>
  );
}
