'use client';

import React from 'react';
import { TONES } from '@/lib/constants';
import { formatTk, round2 } from '@/lib/format';
import { BarChart } from '@/components/ui/BarChart';
import { Legend } from '@/components/ui/Legend';
import { Metric } from '@/components/ui/Metric';
import { Section } from '@/components/ui/Section';
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
  const totalIncome = round2(monthlySummary.reduce((s, m) => s + m.income, 0));
  const totalSpending = round2(monthlySummary.reduce((s, m) => s + m.spending, 0));
  const totalNet = round2(monthlySummary.reduce((s, m) => s + m.cashChange, 0));

  const series = [
    { label: 'Spent', values: monthlySummary.map((m) => m.spending), tone: TONES.primary },
    { label: 'Earned', values: monthlySummary.map((m) => m.income), tone: TONES.tertiary },
  ];

  return (
    <div className="space-y-20">
      <div className="grid gap-10 sm:grid-cols-3">
        <Metric label={`Earned in ${selectedYear}`} value={formatTk(totalIncome)} />
        <Metric label={`Spent in ${selectedYear}`} value={formatTk(totalSpending)} />
        <Metric
          label="Net cash change"
          value={formatTk(totalNet, { showSign: true })}
        />
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
          height={200}
          activeIndex={selectedMonth - 1}
          onSelect={(idx) => onSelectPeriod(selectedYear, idx + 1)}
        />
      </Section>

      <Section title="By month">
        <div className="divide-y divide-neutral-100">
          <div className="grid grid-cols-12 pb-3 text-sm text-neutral-400">
            <span className="col-span-4">Month</span>
            <span className="col-span-2 text-right">Earned</span>
            <span className="col-span-2 text-right">Spent</span>
            <span className="col-span-2 text-right">Change</span>
            <span className="col-span-2 text-right">Balance</span>
          </div>
          {monthlySummary.map((row) => {
            const active = row.monthIndex === selectedMonth;
            return (
              <button
                key={row.monthName}
                type="button"
                onClick={() => onSelectPeriod(selectedYear, row.monthIndex)}
                className={`grid w-full grid-cols-12 items-baseline py-4 text-left transition-colors hover:bg-neutral-50 ${
                  active ? 'text-black' : 'text-neutral-500'
                }`}
              >
                <span className={`col-span-4 text-[17px] ${active ? 'underline underline-offset-4' : 'text-black'}`}>
                  {row.monthName}
                </span>
                <span className="col-span-2 text-right tabular-nums">
                  {formatTk(row.income)}
                </span>
                <span className="col-span-2 text-right tabular-nums">
                  {formatTk(row.spending)}
                </span>
                <span className="col-span-2 text-right tabular-nums">
                  {formatTk(row.cashChange, { showSign: true })}
                </span>
                <span className="col-span-2 text-right tabular-nums text-black">
                  {formatTk(row.cashBalance)}
                </span>
              </button>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
