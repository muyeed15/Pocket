import React from 'react';
import { formatTk } from '@/lib/format';
import { Metric } from '@/components/ui/Metric';
import { Sparkline } from '@/components/ui/Sparkline';

export function BalanceHero({
  cashBalance,
  cashChange,
  dailyBalance,
}: {
  cashBalance: number;
  cashChange: number;
  dailyBalance: number[];
}) {
  return (
    <div className="grid items-end gap-10 md:grid-cols-2">
      <Metric
        size="lg"
        label="Cash on hand"
        value={formatTk(cashBalance)}
        detail={`${formatTk(cashChange, { showSign: true })} this month`}
      />
      <Sparkline values={dailyBalance} />
    </div>
  );
}
