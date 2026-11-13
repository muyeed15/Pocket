'use client';

import React from 'react';
import { formatTk, round2 } from '@/lib/format';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import { Metric } from '@/components/ui/Metric';
import { Sparkline } from '@/components/ui/Sparkline';

export function BalanceHero({
  cashBalance,
  cashChange,
  dailyBalance,
  monthName,
}: {
  cashBalance: number;
  cashChange: number;
  dailyBalance: number[];
  monthName?: string;
}) {
  const symbol = useCurrencySymbol();
  const startingBalance = round2(cashBalance - cashChange);
  const sparkValues =
    dailyBalance.length > 0 ? [startingBalance, ...dailyBalance] : dailyBalance;
  const sparkLabels =
    dailyBalance.length > 0
      ? [
          monthName ? `Start of ${monthName}` : 'Month start',
          ...dailyBalance.map((_, i) =>
            monthName ? `${i + 1} ${monthName}` : `Day ${i + 1}`
          ),
        ]
      : [];

  return (
    <div className="grid items-end gap-4 md:grid-cols-2 md:gap-10">
      <Metric
        size="lg"
        label="Total balance"
        value={formatTk(cashBalance, { symbol })}
      />
      <Sparkline values={sparkValues} labels={sparkLabels} height={64} />
    </div>
  );
}
