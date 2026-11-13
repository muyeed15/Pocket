'use client';

import React, { useState } from 'react';
import {
  IoCheckmark,
  IoCreateOutline,
  IoSwapHorizontalOutline,
} from 'react-icons/io5';
import { ACCOUNT_TYPE_LABELS } from '@/lib/constants';
import { formatDayLabel, formatTk } from '@/lib/format';
import { Button, IconButton } from '@/components/ui/Button';
import {
  ConfirmDeleteButton,
  ROW_ACTIONS_CLASS,
} from '@/components/ui/ConfirmDeleteButton';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import { MoneyInput } from '@/components/ui/Field';
import { Metric } from '@/components/ui/Metric';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Section } from '@/components/ui/Section';
import { Sheet } from '@/components/ui/Sheet';
import type {
  AccountBalanceRow,
  ReconciliationSummary,
  SavingsFundBalanceRow,
  TransferRow,
} from '@/types/ledger';
import { TransferForm } from './TransferForm';

interface AccountsViewProps {
  accounts: AccountBalanceRow[];
  savingsFunds: SavingsFundBalanceRow[];
  transfers: TransferRow[];
  reconciliation: ReconciliationSummary;
  isPending: boolean;
  onUpdateOpeningBalance: (formData: FormData, onSuccess: () => void) => void;
  onAddTransfer: (formData: FormData, onSuccess: () => void) => void;
  onDeleteTransfer: (id: string) => void;
}

export function AccountsView({
  accounts,
  savingsFunds,
  transfers,
  reconciliation,
  isPending,
  onUpdateOpeningBalance,
  onAddTransfer,
  onDeleteTransfer,
}: AccountsViewProps) {
  const symbol = useCurrencySymbol();
  const [transferOpen, setTransferOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const maxBalance = Math.max(1, ...accounts.map((a) => a.currentBalance));
  const totalSavings = savingsFunds.reduce((sum, sf) => sum + sf.currentBalance, 0);
  const isReconciled = Math.abs(reconciliation.difference) < 0.01;

  return (
    <div className="space-y-12 sm:space-y-16">
      <div className="flex flex-wrap items-end justify-between gap-6 sm:gap-10">
        <div className="grid flex-1 grid-cols-2 gap-6 sm:grid-cols-3 sm:gap-10">
          <Metric
            label="Held in accounts"
            value={formatTk(reconciliation.totalHeldInAccounts, { symbol })}
            detail={
              isReconciled
                ? 'Matches ledger entries'
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

        <Button onClick={() => setTransferOpen(true)}>
          <IoSwapHorizontalOutline className="text-lg" />
          Transfer
        </Button>
      </div>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <Section title="Money locations">
          <ul className="space-y-8">
            {accounts.map((acc) => {
              const isEditing = editingId === acc.accountId;
              return (
                <li key={acc.accountId} className="group space-y-2.5">
                  <div className="flex items-baseline justify-between gap-4">
                    <div>
                      <p className="text-[18px]">{acc.accountName}</p>
                      <p className="text-sm text-neutral-500">
                        {ACCOUNT_TYPE_LABELS[acc.accountType]} · started with {formatTk(acc.openingBalance, { symbol })}
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
                    </form>
                  ) : (
                    <ProgressBar value={acc.currentBalance} target={maxBalance} />
                  )}
                </li>
              );
            })}
          </ul>
        </Section>

        <div className="space-y-12">
          <Section title="Savings funds">
            <ul className="divide-y divide-neutral-100">
              {savingsFunds.map((sf) => (
                <li key={sf.savingsFundId} className="flex items-baseline justify-between py-4">
                  <div>
                    <p className="text-[18px]">{sf.savingsFundName}</p>
                    <p className="text-sm text-neutral-500">
                      Deposited {formatTk(sf.totalDeposits, { symbol })}, withdrawn {formatTk(sf.totalWithdrawals, { symbol })}
                    </p>
                  </div>
                  <span className="text-xl tabular-nums">{formatTk(sf.currentBalance, { symbol })}</span>
                </li>
              ))}
            </ul>
          </Section>

          {transfers.length > 0 && (
            <Section title="Recent transfers">
              <ul className="divide-y divide-neutral-100">
                {transfers.map((tr) => (
                  <li key={tr.id} className="group flex items-center gap-4 py-3.5">
                    <div className="min-w-0 flex-1">
                      <p className="text-[17px]">
                        {tr.fromAccountName} to {tr.toAccountName}
                      </p>
                      <p className="text-sm text-neutral-500">{formatDayLabel(tr.transferDate)}</p>
                    </div>
                    <span className="whitespace-nowrap tabular-nums">{formatTk(tr.amount, { symbol })}</span>
                    <div className={ROW_ACTIONS_CLASS}>
                      <ConfirmDeleteButton
                        label="Delete transfer"
                        confirmLabel="Confirm delete transfer"
                        disabled={isPending}
                        onConfirm={() => onDeleteTransfer(tr.id)}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      </div>

      <Sheet title="Transfer" open={transferOpen} onClose={() => setTransferOpen(false)}>
        <TransferForm
          accounts={accounts}
          isPending={isPending}
          onSubmit={(fd) => onAddTransfer(fd, () => setTransferOpen(false))}
        />
      </Sheet>
    </div>
  );
}
