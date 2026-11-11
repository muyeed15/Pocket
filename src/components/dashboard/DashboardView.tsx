import React from 'react';
import { TONES } from '@/lib/constants';
import { formatTk } from '@/lib/format';
import { BarChart } from '@/components/ui/BarChart';
import { Section } from '@/components/ui/Section';
import type { MonthInsights, MonthlySummaryRow } from '@/types/ledger';
import { BalanceHero } from './BalanceHero';
import { MonthRings } from './MonthRings';
import { SpendingByGroup } from './SpendingByGroup';
import { MonthFlowList } from './MonthFlowList';

export function DashboardView({
  summary,
  insights,
}: {
  summary: MonthlySummaryRow;
  insights: MonthInsights;
}) {
  const dayLabels = insights.dailySpending.map((_, i) => String(i + 1));
  const activeDays = insights.dailySpending.filter((v) => v > 0).length;
  const dailyAverage = activeDays > 0 ? summary.spending / activeDays : 0;

  return (
    <div className="space-y-24">
      <BalanceHero
        cashBalance={summary.cashBalance}
        cashChange={summary.cashChange}
        dailyBalance={insights.dailyBalance}
      />

      <div className="grid gap-20 lg:grid-cols-2">
        <Section title="Activity">
          <MonthRings summary={summary} />
        </Section>

        <Section
          title="Daily spending"
          action={
            <span className="text-sm tabular-nums text-neutral-500">
              {formatTk(dailyAverage)} average
            </span>
          }
        >
          <BarChart
            series={[{ label: 'Spent', values: insights.dailySpending, tone: TONES.primary }]}
            labels={dayLabels}
            labelEvery={5}
          />
        </Section>
      </div>

      <div className="grid gap-20 lg:grid-cols-2">
        <Section title="Where it went">
          <SpendingByGroup groups={insights.spendingByGroup} />
        </Section>

        <Section title="Cash flow">
          <MonthFlowList summary={summary} />
        </Section>
      </div>
    </div>
  );
}
