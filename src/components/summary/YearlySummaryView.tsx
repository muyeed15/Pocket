'use client';

import React from 'react';
import { TONES } from '@/lib/constants';
import { formatTk, round2 } from '@/lib/format';
import { BarChart } from '@/components/ui/BarChart';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import { Legend } from '@/components/ui/Legend';
import { Metric } from '@/components/ui/Metric';
import { Section } from '@/components/ui/Section';
import { MonthFlowList, type CashFlowTotals } from '@/components/dashboard/MonthFlowList';
import type { MonthlySummaryRow } from '@/types/ledger';

interface YearlySummaryViewProps {
  selectedYear: number;
  selectedMonth: number;
  monthlySummary: MonthlySummaryRow[];
  onSelectPeriod: (year: number, month: number) => void;
}

export function YearlySummaryView({
  selectedYear,
  selectedMonth,
  monthlySummary,
  onSelectPeriod,
}: YearlySummaryViewProps) {
  const symbol = useCurrencySymbol();

  const yearlyTotals: CashFlowTotals = {
    income: round2(monthlySummary.reduce((s, m) => s + m.income, 0)),
    spending: round2(monthlySummary.reduce((s, m) => s + m.spending, 0)),
    borrowed: round2(monthlySummary.reduce((s, m) => s + m.borrowed, 0)),
    debtPaid: round2(monthlySummary.reduce((s, m) => s + m.debtPaid, 0)),
    transfersNet: round2(monthlySummary.reduce((s, m) => s + m.transfersNet, 0)),
    untrackedNet: round2(monthlySummary.reduce((s, m) => s + m.untrackedNet, 0)),
    saved: round2(monthlySummary.reduce((s, m) => s + m.saved, 0)),
    savingsUsed: round2(monthlySummary.reduce((s, m) => s + m.savingsUsed, 0)),
    cashChange: round2(monthlySummary.reduce((s, m) => s + m.cashChange, 0)),
  };

  const otherMoves = round2(
    yearlyTotals.cashChange - (yearlyTotals.income - yearlyTotals.spending)
  );
  const yearEndBalance = monthlySummary[monthlySummary.length - 1]?.cashBalance ?? 0;

  const series = [
    { label: 'Spent', values: monthlySummary.map((m) => m.spending), tone: TONES.primary },
    { label: 'Earned', values: monthlySummary.map((m) => m.income), tone: TONES.tertiary },
  ];

  return (
    <div className="space-y-12 sm:space-y-16">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-10">
        <Metric label={`Earned (${selectedYear})`} value={formatTk(yearlyTotals.income, { symbol })} />
        <Metric label={`Spent (${selectedYear})`} value={formatTk(yearlyTotals.spending, { symbol })} />
        <div className="col-span-2 sm:col-span-1">
          <Metric
            label="Net change"
            value={formatTk(yearlyTotals.cashChange, { showSign: true, symbol })}
            detail={
              otherMoves !== 0
                ? `${formatTk(otherMoves, { showSign: true, symbol })} outside earned/spent`
                : `Cash ${formatTk(yearEndBalance, { symbol })}`
            }
          />
        </div>
      </div>

      <Section
        title="Twelve months"
        action={
          <Legend
            items={[
              { label: 'Spent', tone: TONES.primary },
              { label: 'Earned', tone: TONES.tertiary },
            ]}
          />
        }
      >
        <BarChart
          series={series}
          labels={monthlySummary.map((m) => m.monthName.slice(0, 3))}
          height={176}
          activeIndex={selectedMonth - 1}
          onSelect={(idx) => onSelectPeriod(selectedYear, idx + 1)}
          formatLabel={(_, idx) => monthlySummary[idx]?.monthName ?? ''}
          emptyMessage={`No entries in ${selectedYear}`}
        />
      </Section>

      <div className="grid gap-12 lg:grid-cols-3 lg:gap-16">
        <Section title="Full-year cash flow" className="min-w-0 lg:col-span-1">
          <MonthFlowList
            summary={yearlyTotals}
            netLabel={`Net change in ${selectedYear}`}
            endingBalance={yearEndBalance}
            endingLabel={`Cash left end of ${selectedYear}`}
          />
        </Section>

        <Section title="By month" className="min-w-0 lg:col-span-2">
          {/* Mobile scannable rows without hidden horizontal columns */}
          <div className="divide-y divide-neutral-100 sm:hidden">
            {monthlySummary.map((row) => {
              const active = row.monthIndex === selectedMonth;
              const isEmpty =
                row.income === 0 &&
                row.spending === 0 &&
                row.cashChange === 0 &&
                row.cashBalance === 0;
              return (
                <button
                  key={row.monthName}
                  type="button"
                  onClick={() => onSelectPeriod(selectedYear, row.monthIndex)}
                  className={`block w-full py-3.5 text-left transition-colors hover:bg-neutral-50 ${
                    isEmpty ? 'text-neutral-400' : 'text-neutral-600'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-4">
                    <span
                      className={`text-[16px] ${
                        active ? 'text-black underline underline-offset-4' : isEmpty ? 'text-neutral-400' : 'text-black'
                      }`}
                    >
                      {row.monthName}
                    </span>
                    <span className="whitespace-nowrap text-sm tabular-nums text-black">
                      Left {formatTk(row.cashBalance, { symbol })}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs tabular-nums">
                    <span className="whitespace-nowrap">
                      In {row.income === 0 ? '—' : formatTk(row.income, { symbol })}
                    </span>
                    <span className="whitespace-nowrap">
                      Out {row.spending === 0 ? '—' : formatTk(row.spending, { symbol })}
                    </span>
                    <span className="whitespace-nowrap">
                      Net {row.cashChange === 0 ? '—' : formatTk(row.cashChange, { showSign: true, symbol })}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="hidden overflow-x-auto sm:block">
            <div className="min-w-[540px] divide-y divide-neutral-100">
              <div className="grid grid-cols-12 pb-3 text-sm text-neutral-400">
              <span className="col-span-4">Month</span>
              <span className="col-span-2 text-right">Earned</span>
              <span className="col-span-2 text-right">Spent</span>
              <span className="col-span-2 text-right">Net</span>
              <span className="col-span-2 text-right">Cash left</span>
            </div>
            {monthlySummary.map((row) => {
              const active = row.monthIndex === selectedMonth;
              const isEmpty =
                row.income === 0 &&
                row.spending === 0 &&
                row.cashChange === 0 &&
                row.cashBalance === 0;
              return (
                <button
                  key={row.monthName}
                  type="button"
                  onClick={() => onSelectPeriod(selectedYear, row.monthIndex)}
                  className={`grid w-full grid-cols-12 items-baseline py-4 text-left transition-colors hover:bg-neutral-50 ${
                    active ? 'text-black' : isEmpty ? 'text-neutral-400' : 'text-neutral-500'
                  }`}
                >
                  <span
                    className={`col-span-4 text-[17px] ${
                      active ? 'underline underline-offset-4' : isEmpty ? 'text-neutral-400' : 'text-black'
                    }`}
                  >
                    {row.monthName}
                  </span>
                  <span className="col-span-2 text-right tabular-nums">
                    {row.income === 0 ? '—' : formatTk(row.income, { symbol })}
                  </span>
                  <span className="col-span-2 text-right tabular-nums">
                    {row.spending === 0 ? '—' : formatTk(row.spending, { symbol })}
                  </span>
                  <span className="col-span-2 text-right tabular-nums">
                    {row.cashChange === 0
                      ? '—'
                      : formatTk(row.cashChange, { showSign: true, symbol })}
                  </span>
                  <span className="col-span-2 text-right tabular-nums text-black">
                    {formatTk(row.cashBalance, { symbol })}
                  </span>
                </button>
              );
            })}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}
