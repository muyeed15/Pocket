'use client';

import React from 'react';
import { TONES } from '@/lib/constants';
import { formatTk } from '@/lib/format';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import { BarChart } from '@/components/ui/BarChart';
import { Section } from '@/components/ui/Section';
import type { MonthInsights, MonthlySummaryRow } from '@/types/ledger';
import { BalanceHero } from './BalanceHero';
import { MonthRings } from './MonthRings';
import { SpendingByGroup } from './SpendingByGroup';
import { MonthFlowList, type CashFlowKey } from './MonthFlowList';

export function DashboardView({
  summary,
  insights,
  onSelectFlow,
  onSelectGroup,
}: {
  summary: MonthlySummaryRow;
  insights: MonthInsights;
  onSelectFlow?: (key: CashFlowKey) => void;
  onSelectGroup?: (groupName: string) => void;
}) {
  const symbol = useCurrencySymbol();
  const dayLabels = insights.dailySpending.map((_, i) => String(i + 1));
  const activeDays = insights.dailySpending.filter((v) => v > 0).length;
  const dailyAverage = activeDays > 0 ? summary.spending / activeDays : 0;

  return (
    <div className="space-y-12 sm:space-y-16">
      <BalanceHero
        cashBalance={summary.cashBalance}
        cashChange={summary.cashChange}
        dailyBalance={insights.dailyBalance}
        monthName={summary.monthName}
      />

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Section
          title="Daily spending"
          action={
            activeDays > 0 ? (
              <span className="text-sm tabular-nums text-neutral-500">
                {formatTk(dailyAverage, { symbol })} avg
              </span>
            ) : undefined
          }
          className="min-w-0 lg:order-2"
        >
          <BarChart
            series={[{ label: 'Spent', values: insights.dailySpending, tone: TONES.primary }]}
            labels={dayLabels}
            height={160}
            labelEvery={5}
            formatLabel={(day) => `${day} ${summary.monthName}`}
            emptyMessage={`No spending in ${summary.monthName}`}
          />
        </Section>

        <Section title="Activity" className="min-w-0 lg:order-1">
          <MonthRings summary={summary} />
        </Section>
      </div>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Section title="Where it went" className="min-w-0">
          <SpendingByGroup
            groups={insights.spendingByGroup}
            onSelectGroup={onSelectGroup}
          />
        </Section>

        <Section title="Cash flow" className="min-w-0">
          <MonthFlowList
            summary={summary}
            netLabel={`Net change in ${summary.monthName}`}
            endingBalance={summary.cashBalance}
            endingLabel="Cash left"
            onSelectRow={onSelectFlow}
          />
        </Section>
      </div>
    </div>
  );
}
