'use client';

import React, { useMemo, useState } from 'react';
import { IoSwapHorizontalOutline } from 'react-icons/io5';
import { ACCOUNT_TYPE_LABELS, MONTH_NAMES } from '@/lib/constants';
import {
  formatDayLabel,
  formatTk,
  getMonthPrefix,
  round2,
} from '@/lib/format';
import { filterTransfers } from '@/lib/summary';
import { Button } from '@/components/ui/Button';
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import { SearchField } from '@/components/ui/Field';
import { Metric } from '@/components/ui/Metric';
import { EmptyState } from '@/components/ui/Section';
import type { AccountBalanceRow, TransferRow } from '@/types/ledger';
import { TransferRowItem } from './TransferRowItem';

type Scope = 'month' | 'all';

interface TransfersViewProps {
  selectedYear: number;
  selectedMonth: number;
  accounts: AccountBalanceRow[];
  transfers: TransferRow[];
  initialAccountFilter?: string;
  isPending: boolean;
  onAddTransfer?: () => void;
  onEditTransfer: (tr: TransferRow) => void;
  onDeleteTransfer: (id: string) => void;
}

export function TransfersView({
  selectedYear,
  selectedMonth,
  accounts,
  transfers,
  initialAccountFilter = 'ALL',
  isPending,
  onAddTransfer,
  onEditTransfer,
  onDeleteTransfer,
}: TransfersViewProps) {
  const symbol = useCurrencySymbol();
  const [scope, setScope] = useState<Scope>('month');
  const [accountFilter, setAccountFilter] = useState<string>(initialAccountFilter);
  const [chargesOnly, setChargesOnly] = useState(false);
  const [query, setQuery] = useState('');

  const monthPrefix = getMonthPrefix(selectedYear, selectedMonth);
  const monthLabel = `${MONTH_NAMES[selectedMonth - 1] ?? ''} ${selectedYear}`;
  const selectedAccount = accounts.find((a) => a.accountId === accountFilter);

  const accountOptions: ComboboxOption[] = useMemo(
    () => [
      { value: 'ALL', label: 'All accounts' },
      ...accounts.map((a) => ({
        value: a.accountId,
        label: a.accountName,
        hint: ACCOUNT_TYPE_LABELS[a.accountType],
      })),
    ],
    [accounts]
  );

  const visible = useMemo(
    () =>
      filterTransfers({
        transfers,
        scope,
        monthPrefix,
        accountId: accountFilter,
        chargesOnly,
        query,
      }),
    [transfers, scope, monthPrefix, accountFilter, chargesOnly, query]
  );

  const stats = useMemo(() => {
    let moved = 0;
    let fees = 0;
    let chargedCount = 0;
    let received = 0;
    let sent = 0;
    let chargedOutFees = 0;

    for (const tr of visible) {
      moved += tr.amount;
      if (tr.feeAmount > 0) {
        fees += tr.feeAmount;
        chargedCount += 1;
      }
      if (accountFilter !== 'ALL') {
        if (tr.toAccountId === accountFilter) {
          received += tr.amount;
        }
        if (tr.fromAccountId === accountFilter) {
          sent += tr.amount;
          chargedOutFees += tr.feeAmount;
        }
      }
    }

    return {
      moved: round2(moved),
      fees: round2(fees),
      debited: round2(moved + fees),
      chargedCount,
      received: round2(received),
      sent: round2(sent),
      chargedOutFees: round2(chargedOutFees),
      accountNet: round2(received - sent - chargedOutFees),
    };
  }, [visible, accountFilter]);

  const days = useMemo(() => {
    const groups = new Map<
      string,
      { items: TransferRow[]; moved: number; fees: number; accountNet: number }
    >();
    for (const tr of visible) {
      const group = groups.get(tr.transferDate) ?? {
        items: [],
        moved: 0,
        fees: 0,
        accountNet: 0,
      };
      group.items.push(tr);
      group.moved += tr.amount;
      group.fees += tr.feeAmount;
      if (accountFilter !== 'ALL') {
        if (tr.toAccountId === accountFilter) group.accountNet += tr.amount;
        if (tr.fromAccountId === accountFilter) {
          group.accountNet -= tr.amount + tr.feeAmount;
        }
      }
      groups.set(tr.transferDate, group);
    }
    return [...groups.entries()].sort(([dateA], [dateB]) =>
      dateB.localeCompare(dateA)
    );
  }, [visible, accountFilter]);

  const isFiltering =
    Boolean(query.trim()) || accountFilter !== 'ALL' || chargesOnly;
  const emptyMessage = isFiltering
    ? `No matching transfers${scope === 'month' ? ` in ${monthLabel}` : ''}`
    : scope === 'month'
      ? `No transfers in ${monthLabel}`
      : 'No transfers recorded yet';

  const emptyAction =
    isFiltering || scope === 'month' ? (
      <div className="flex flex-wrap items-center justify-center gap-3">
        {scope === 'month' && (
          <Button variant="ghost" onClick={() => setScope('all')}>
            Search all time
          </Button>
        )}
        {isFiltering && (
          <Button
            variant="ghost"
            onClick={() => {
              setQuery('');
              setAccountFilter('ALL');
              setChargesOnly(false);
            }}
          >
            Clear filters
          </Button>
        )}
        {!isFiltering && onAddTransfer && (
          <Button variant="ghost" onClick={onAddTransfer}>
            New transfer
          </Button>
        )}
      </div>
    ) : onAddTransfer ? (
      <Button variant="ghost" onClick={onAddTransfer}>
        New transfer
      </Button>
    ) : null;

  const periodSuffix =
    scope === 'month' ? `in ${MONTH_NAMES[selectedMonth - 1] ?? ''}` : 'all time';

  return (
    <div className="space-y-8 sm:space-y-12">
      <div className="flex flex-wrap items-end justify-between gap-6 sm:gap-10">
        {selectedAccount ? (
          <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-10">
            <Metric
              label="Received"
              value={formatTk(stats.received, { symbol })}
              detail={`In to ${selectedAccount.accountName}`}
            />
            <Metric
              label="Sent"
              value={formatTk(stats.sent, { symbol })}
              detail={`Out from ${selectedAccount.accountName}`}
            />
            <div className="col-span-2 sm:col-span-1">
              <Metric
                label="Service charges"
                value={formatTk(stats.chargedOutFees, { symbol })}
                detail={`Net ${formatTk(stats.accountNet, { showSign: true, symbol })}`}
              />
            </div>
          </div>
        ) : (
          <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-10">
            <Metric
              label="Moved"
              value={formatTk(stats.moved, { symbol })}
              detail={`${visible.length} ${visible.length === 1 ? 'transfer' : 'transfers'} ${periodSuffix}`}
            />
            <Metric
              label="Service charges"
              value={formatTk(stats.fees, { symbol })}
              detail={
                stats.chargedCount > 0
                  ? `Across ${stats.chargedCount} ${stats.chargedCount === 1 ? 'transfer' : 'transfers'}`
                  : 'No service charges'
              }
            />
            <div className="col-span-2 sm:col-span-1">
              <Metric
                label="Total deducted"
                value={formatTk(stats.debited, { symbol })}
                detail="Amount + charges"
              />
            </div>
          </div>
        )}

        {onAddTransfer && (
          <Button onClick={onAddTransfer}>
            <IoSwapHorizontalOutline className="text-lg" />
            New transfer
          </Button>
        )}
      </div>

      <div className="space-y-6 sm:space-y-10">
        <div className="flex flex-col gap-3 border-b border-neutral-200 pb-3 lg:flex-row lg:items-center lg:gap-8 lg:pb-4">
          <SearchField
            value={query}
            onChange={setQuery}
            label="Search transfers"
            placeholder="Search"
          />

          <div className="flex flex-wrap items-center justify-between gap-4 sm:justify-start sm:gap-7">
            <div className="flex gap-5 text-[15px]">
              {(['month', 'all'] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setScope(value)}
                  className={
                    scope === value
                      ? 'text-black'
                      : 'text-neutral-400 hover:text-black'
                  }
                >
                  {value === 'month' ? 'This month' : 'All time'}
                </button>
              ))}
              <button
                type="button"
                aria-pressed={chargesOnly}
                onClick={() => setChargesOnly((prev) => !prev)}
                className={
                  chargesOnly
                    ? 'text-black'
                    : 'text-neutral-400 hover:text-black'
                }
              >
                Charges only
              </button>
            </div>

            <Combobox
              ariaLabel="Filter by account"
              options={accountOptions}
              value={accountFilter}
              onChange={(val) => setAccountFilter(val || 'ALL')}
              allowClear={accountFilter !== 'ALL'}
              placeholder="All accounts"
              className="w-full sm:w-44"
              inputClassName="border-b-0 py-1.5 text-[15px] text-neutral-600"
            />
          </div>
        </div>

        {visible.length > 0 && (
          <div className="flex flex-wrap items-baseline justify-between gap-4 text-sm text-neutral-500">
            <div className="flex items-baseline gap-4">
              <span className="tabular-nums">
                {visible.length}{' '}
                {visible.length === 1 ? 'transfer' : 'transfers'}
              </span>
              {isFiltering && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setAccountFilter('ALL');
                    setChargesOnly(false);
                  }}
                  className="text-neutral-400 transition-colors hover:text-black"
                >
                  Clear filters
                </button>
              )}
            </div>
            {selectedAccount ? (
              <div className="flex flex-wrap gap-x-6 gap-y-1 tabular-nums">
                {stats.received > 0 && (
                  <span>+{formatTk(stats.received, { symbol })} in</span>
                )}
                {stats.sent + stats.chargedOutFees > 0 && (
                  <span>
                    -{formatTk(round2(stats.sent + stats.chargedOutFees), { symbol })}{' '}
                    out
                  </span>
                )}
                <span className="text-black">
                  Net {formatTk(stats.accountNet, { showSign: true, symbol })}
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-x-6 gap-y-1 tabular-nums">
                <span className="text-black">
                  {formatTk(stats.moved, { symbol })} moved
                </span>
                {stats.fees > 0 && (
                  <span>
                    Service charges -{formatTk(stats.fees, { symbol })}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {days.length === 0 ? (
          <EmptyState>
            <p>{emptyMessage}</p>
            {emptyAction && <div className="mt-3">{emptyAction}</div>}
          </EmptyState>
        ) : (
          <div className="space-y-12 sm:space-y-14">
            {days.map(([date, group]) => (
              <section key={date}>
                <div className="flex items-baseline justify-between border-b border-neutral-200 pb-2 text-sm text-neutral-500 sm:pr-[104px]">
                  <h3>{formatDayLabel(date)}</h3>
                  <span className="whitespace-nowrap tabular-nums">
                    {accountFilter !== 'ALL'
                      ? formatTk(round2(group.accountNet), {
                          showSign: true,
                          symbol,
                        })
                      : `${formatTk(round2(group.moved), { symbol })} moved${
                          group.fees > 0
                            ? ` · -${formatTk(round2(group.fees), { symbol })} charge`
                            : ''
                        }`}
                  </span>
                </div>
                <ul className="divide-y divide-neutral-100">
                  {group.items.map((tr) => (
                    <TransferRowItem
                      key={tr.id}
                      transfer={tr}
                      accountPerspectiveId={accountFilter}
                      isPending={isPending}
                      onEdit={onEditTransfer}
                      onDelete={onDeleteTransfer}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
