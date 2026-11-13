'use client';

import React from 'react';
import { formatTk, round2 } from '@/lib/format';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import { Metric } from '@/components/ui/Metric';
import { Sparkline } from '@/components/ui/Sparkline';

export function BalanceHero({
  cashBalance,
  cashChange,
  earned,
  spent,
  savingsBalance = 0,
  dailyBalance,
  monthName,
}: {
  cashBalance: number;
  cashChange: number;
  earned?: number;
  spent?: number;
  savingsBalance?: number;
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

  const period = monthName ? `in ${monthName}` : 'this month';
  const changePhrase =
    cashChange > 0
      ? `Up ${formatTk(cashChange, { symbol })} ${period}`
      : cashChange < 0
        ? `Down ${formatTk(Math.abs(cashChange), { symbol })} ${period}`
        : `No change ${period}`;

  return (
    <div className="grid items-end gap-4 md:grid-cols-2 md:gap-10">
      <Metric
        size="lg"
        label="Cash on hand"
        value={formatTk(cashBalance, { symbol })}
        detail={
          <span className="block space-y-1">
            <span className="block text-neutral-600">{changePhrase}</span>
            {earned !== undefined && spent !== undefined && (
              <span className="flex flex-wrap gap-x-4 gap-y-0.5 tabular-nums text-neutral-500">
                <span className="whitespace-nowrap">
                  Earned {formatTk(earned, { symbol })}
                </span>
                <span className="whitespace-nowrap">
                  Spent {formatTk(spent, { symbol })}
                </span>
                {savingsBalance > 0 && (
                  <span className="whitespace-nowrap">
                    Saved {formatTk(savingsBalance, { symbol })}
                  </span>
                )}
              </span>
            )}
          </span>
        }
      />
      <Sparkline values={sparkValues} labels={sparkLabels} height={64} />
    </div>
  );
}
