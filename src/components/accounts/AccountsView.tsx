'use client';

import React, { useState } from 'react';
import {
  IoCheckmark,
  IoCreateOutline,
  IoSwapHorizontalOutline,
  IoTrashOutline,
} from 'react-icons/io5';
import { ACCOUNT_TYPE_LABELS } from '@/lib/constants';
import { formatDayLabel, formatTk } from '@/lib/format';
import { Button, IconButton } from '@/components/ui/Button';
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
  const [transferOpen, setTransferOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const maxBalance = Math.max(1, ...accounts.map((a) => a.currentBalance));
  const totalSavings = savingsFunds.reduce((sum, sf) => sum + sf.currentBalance, 0);
  const isReconciled = Math.abs(reconciliation.difference) < 0.01;

  return (
    <div className="space-y-20">
      <div className="flex flex-wrap items-end justify-between gap-10">
        <div className="grid flex-1 gap-10 sm:grid-cols-3">
          <Metric
            label="Held in accounts"
            value={formatTk(reconciliation.totalHeldInAccounts)}
            detail={
              isReconciled
                ? 'Matches ledger balance'
                : `${formatTk(reconciliation.difference, { showSign: true })} difference`
            }
          />
          <Metric
            label="Ledger cash"
            value={formatTk(reconciliation.ledgerCashBalance)}
          />
          <Metric label="Savings funds" value={formatTk(totalSavings)} />
        </div>

        <Button onClick={() => setTransferOpen(true)}>
          <IoSwapHorizontalOutline className="text-lg" />
          Transfer
        </Button>
      </div>

      <div className="grid gap-20 lg:grid-cols-2">
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
                        {ACCOUNT_TYPE_LABELS[acc.accountType]}, opening {formatTk(acc.openingBalance)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl tabular-nums">{formatTk(acc.currentBalance)}</span>
                      <IconButton
                        label="Edit opening balance"
                        onClick={() => setEditingId(isEditing ? null : acc.accountId)}
                        className="sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                      >
                        <IoCreateOutline />
                      </IconButton>
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
                      <input
                        type="number"
                        name="openingBalance"
                        step="0.01"
                        defaultValue={acc.openingBalance}
                        autoFocus
                        className="w-36 border-b border-black bg-transparent py-1 text-right tabular-nums focus:outline-none"
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

        <div className="space-y-16">
          <Section title="Savings funds">
            <ul className="divide-y divide-neutral-100">
              {savingsFunds.map((sf) => (
                <li key={sf.savingsFundId} className="flex items-baseline justify-between py-4">
                  <div>
                    <p className="text-[18px]">{sf.savingsFundName}</p>
                    <p className="text-sm text-neutral-500">
                      Deposited {formatTk(sf.totalDeposits)}, withdrawn {formatTk(sf.totalWithdrawals)}
                    </p>
                  </div>
                  <span className="text-xl tabular-nums">{formatTk(sf.currentBalance)}</span>
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
                    <span className="tabular-nums">{formatTk(tr.amount)}</span>
                    <IconButton
                      label="Delete transfer"
                      disabled={isPending}
                      onClick={() => onDeleteTransfer(tr.id)}
                      className="sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
                    >
                      <IoTrashOutline />
                    </IconButton>
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
