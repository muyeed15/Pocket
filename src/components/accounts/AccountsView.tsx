'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  IoCheckmark,
  IoClose,
  IoCreateOutline,
  IoSwapHorizontalOutline,
} from 'react-icons/io5';
import { ACCOUNT_TYPE_LABELS } from '@/lib/constants';
import { formatTk } from '@/lib/format';
import { Button, IconButton } from '@/components/ui/Button';
import { ROW_ACTIONS_CLASS } from '@/components/ui/ConfirmDeleteButton';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import { MoneyInput } from '@/components/ui/Field';
import { Metric } from '@/components/ui/Metric';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { EmptyState, Section } from '@/components/ui/Section';
import type {
  AccountBalanceRow,
  ReconciliationSummary,
  SavingsFundBalanceRow,
} from '@/types/ledger';

interface AccountsViewProps {
  accounts: AccountBalanceRow[];
  savingsFunds: SavingsFundBalanceRow[];
  reconciliation: ReconciliationSummary;
  isPending: boolean;
  onUpdateOpeningBalance: (formData: FormData, onSuccess: () => void) => void;
  onNewTransfer?: () => void;
  onOpenAccountLedger?: (accountId: string) => void;
  onOpenAccountTransfers?: (accountId: string) => void;
}

export function AccountsView({
  accounts,
  savingsFunds,
  reconciliation,
  isPending,
  onUpdateOpeningBalance,
  onNewTransfer,
  onOpenAccountLedger,
  onOpenAccountTransfers,
}: AccountsViewProps) {
  const symbol = useCurrencySymbol();
  const [editingId, setEditingId] = useState<string | null>(null);
  const maxBalance = Math.max(1, ...accounts.map((a) => a.currentBalance));
  const totalSavings = savingsFunds.reduce((sum, sf) => sum + sf.currentBalance, 0);
  const isReconciled = Math.abs(reconciliation.difference) < 0.01;

  return (
    <div className="space-y-12 sm:space-y-16">
      <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-10">
        <Metric
          label="Held in accounts"
          value={formatTk(reconciliation.totalHeldInAccounts, { symbol })}
          detail={
            isReconciled
              ? undefined
              : `Differs from ledger by ${formatTk(Math.abs(reconciliation.difference), { symbol })}`
          }
        />
        <Metric
          label="Ledger cash"
          value={formatTk(reconciliation.ledgerCashBalance, { symbol })}
        />
        <div className="col-span-2 sm:col-span-1">
          <Metric label="Saved" value={formatTk(totalSavings, { symbol })} />
        </div>
      </div>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Section
          title="Money locations"
          action={
            <div className="flex items-center gap-2">
              {onNewTransfer && accounts.length >= 2 && (
                <Button variant="ghost" onClick={onNewTransfer}>
                  <IoSwapHorizontalOutline className="text-base" />
                  Transfer
                </Button>
              )}
              <Link
                href="/settings"
                className="rounded-full px-3 py-1.5 text-[15px] text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-black"
              >
                Manage
              </Link>
            </div>
          }
        >
          {accounts.length === 0 ? (
            <EmptyState>
              <p>No accounts configured yet</p>
            </EmptyState>
          ) : (
            <ul className="space-y-8">
              {accounts.map((acc) => {
                const isEditing = editingId === acc.accountId;
                return (
                  <li key={acc.accountId} className="group space-y-2.5">
                    <div className="flex items-baseline justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[18px]">{acc.accountName}</p>
                        <p className="text-sm text-neutral-500">
                          {ACCOUNT_TYPE_LABELS[acc.accountType]} · started with {formatTk(acc.openingBalance, { symbol })}
                          {(acc.moneyIn > 0 || acc.moneyOut > 0) && (
                            <>
                              {' '}· in {formatTk(acc.moneyIn, { symbol })} · out {formatTk(acc.moneyOut, { symbol })}
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center">
                        <span className="whitespace-nowrap text-xl tabular-nums">
                          {formatTk(acc.currentBalance, { symbol })}
                        </span>
                        <div className={ROW_ACTIONS_CLASS}>
                          <IconButton
                            label="Edit opening balance"
                            onClick={() => setEditingId(isEditing ? null : acc.accountId)}
                          >
                            <IoCreateOutline />
                          </IconButton>
                        </div>
                      </div>
                    </div>

                    {isEditing ? (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          onUpdateOpeningBalance(new FormData(e.currentTarget), () =>
                            setEditingId(null)
                          );
                        }}
                        className="flex items-center gap-3 pt-1"
                      >
                        <input type="hidden" name="accountId" value={acc.accountId} />
                        <span className="text-sm text-neutral-500">Opening</span>
                        <MoneyInput
                          name="openingBalance"
                          step="0.01"
                          defaultValue={acc.openingBalance}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Escape') {
                              setEditingId(null);
                            }
                          }}
                          className="w-36 text-[17px]"
                          inputClassName="py-1 text-right"
                        />
                        <IconButton label="Save opening balance" solid type="submit" disabled={isPending}>
                          <IoCheckmark />
                        </IconButton>
                        <IconButton label="Cancel" disabled={isPending} onClick={() => setEditingId(null)}>
                          <IoClose />
                        </IconButton>
                      </form>
                    ) : (
                      <>
                        <ProgressBar value={acc.currentBalance} target={maxBalance} />
                        {(onOpenAccountLedger || onOpenAccountTransfers) && (
                          <div className="flex gap-4 pt-0.5 text-xs text-neutral-400">
                            {onOpenAccountLedger && (
                              <button
                                type="button"
                                onClick={() => onOpenAccountLedger(acc.accountId)}
                                className="transition-colors hover:text-black"
                              >
                                View entries
                              </button>
                            )}
                            {onOpenAccountTransfers && (
                              <button
                                type="button"
                                onClick={() => onOpenAccountTransfers(acc.accountId)}
                                className="transition-colors hover:text-black"
                              >
                                View transfers
                              </button>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="Savings funds">
          {savingsFunds.length === 0 ? (
            <EmptyState>
              <p>No savings funds configured yet</p>
            </EmptyState>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {savingsFunds.map((sf) => (
                <li key={sf.savingsFundId} className="flex items-baseline justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[18px]">{sf.savingsFundName}</p>
                    <p className="text-sm text-neutral-500">
                      Deposited {formatTk(sf.totalDeposits, { symbol })}, withdrawn {formatTk(sf.totalWithdrawals, { symbol })}
                    </p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-xl tabular-nums">
                    {formatTk(sf.currentBalance, { symbol })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </div>
  );
}
