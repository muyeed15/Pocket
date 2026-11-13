'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { IoSwapHorizontalOutline } from 'react-icons/io5';
import { ACCOUNT_TYPE_LABELS } from '@/lib/constants';
import { formatTk, round2, todayLocalIso } from '@/lib/format';
import { Button, IconButton } from '@/components/ui/Button';
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import { Field, fieldClass, MoneyInput } from '@/components/ui/Field';
import type { AccountBalanceRow, TransferRow } from '@/types/ledger';

interface TransferFormProps {
  accounts: AccountBalanceRow[];
  initialTransfer?: TransferRow | null;
  defaultDate?: string;
  isPending: boolean;
  onSubmit: (formData: FormData) => void;
}

export function TransferForm({
  accounts,
  initialTransfer,
  defaultDate,
  isPending,
  onSubmit,
}: TransferFormProps) {
  const symbol = useCurrencySymbol();
  const [amount, setAmount] = useState(
    initialTransfer ? String(initialTransfer.amount) : ''
  );
  const [feeAmount, setFeeAmount] = useState(
    initialTransfer && initialTransfer.feeAmount > 0
      ? String(initialTransfer.feeAmount)
      : ''
  );
  const [fromAccountId, setFromAccountId] = useState(
    initialTransfer?.fromAccountId ?? ''
  );
  const [toAccountId, setToAccountId] = useState(
    initialTransfer?.toAccountId ?? ''
  );

  const parsedAmount = Number(amount);
  const parsedFee = feeAmount.trim() === '' ? 0 : Number(feeAmount);
  const hasFee = Number.isFinite(parsedFee) && parsedFee > 0;
  const fromAccount = accounts.find((a) => a.accountId === fromAccountId);
  const fromAccountName = fromAccount?.accountName;
  const totalOutflow =
    Number.isFinite(parsedAmount) && parsedAmount > 0
      ? round2(parsedAmount + (Number.isFinite(parsedFee) ? parsedFee : 0))
      : 0;
  const effectiveAvailable = fromAccount
    ? initialTransfer && initialTransfer.fromAccountId === fromAccountId
      ? round2(
          fromAccount.currentBalance +
            initialTransfer.amount +
            initialTransfer.feeAmount
        )
      : fromAccount.currentBalance
    : 0;
  const hasEnoughAccounts = accounts.length >= 2;
  const fromHint = fromAccount
    ? totalOutflow > effectiveAvailable
      ? `Available ${formatTk(fromAccount.currentBalance, { symbol })} · exceeds balance`
      : `Available ${formatTk(fromAccount.currentBalance, { symbol })}`
    : undefined;
  const feeHint = hasFee
    ? Number.isFinite(parsedAmount) && parsedAmount > 0
      ? `${formatTk(round2(parsedAmount + parsedFee), { symbol })} deducted from ${fromAccountName ?? 'source'}`
      : `Deducted from ${fromAccountName ?? 'source'}`
    : 'Optional';

  const accountOptions: ComboboxOption[] = useMemo(
    () =>
      accounts.map((a) => ({
        value: a.accountId,
        label: a.accountName,
        hint: ACCOUNT_TYPE_LABELS[a.accountType],
      })),
    [accounts]
  );

  const fromOptions = useMemo(
    () =>
      toAccountId
        ? accountOptions.filter((o) => o.value !== toAccountId)
        : accountOptions,
    [accountOptions, toAccountId]
  );

  const toOptions = useMemo(
    () =>
      fromAccountId
        ? accountOptions.filter((o) => o.value !== fromAccountId)
        : accountOptions,
    [accountOptions, fromAccountId]
  );

  function swapAccounts() {
    setFromAccountId(toAccountId);
    setToAccountId(fromAccountId);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(new FormData(e.currentTarget));
      }}
      className="space-y-7"
    >
      {initialTransfer && (
        <input type="hidden" name="id" value={initialTransfer.id} />
      )}

      <Field label="Amount">
        <MoneyInput
          name="amount"
          step="0.01"
          min="0.01"
          required
          autoFocus
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="text-4xl"
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-start sm:gap-3">
        <Field label="From" hint={fromHint}>
          <Combobox
            name="fromAccountId"
            required
            options={fromOptions}
            value={fromAccountId}
            onChange={setFromAccountId}
            placeholder="Select account"
          />
        </Field>

        <div className="flex justify-end sm:pt-7">
          <IconButton
            label="Swap accounts"
            disabled={!fromAccountId && !toAccountId}
            onClick={swapAccounts}
          >
            <IoSwapHorizontalOutline />
          </IconButton>
        </div>

        <Field label="To">
          <Combobox
            name="toAccountId"
            required
            options={toOptions}
            value={toAccountId}
            onChange={setToAccountId}
            placeholder="Select account"
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Field label="Service charge" hint={feeHint}>
          <MoneyInput
            name="feeAmount"
            step="0.01"
            min="0"
            value={feeAmount}
            onChange={(e) => setFeeAmount(e.target.value)}
            placeholder="0.00"
            className="text-[17px]"
          />
        </Field>

        <Field label="Date">
          <input
            type="date"
            name="transferDate"
            defaultValue={
              initialTransfer?.transferDate ?? defaultDate ?? todayLocalIso()
            }
            required
            className={fieldClass}
          />
        </Field>
      </div>

      <Field label="Note">
        <input
          type="text"
          name="description"
          defaultValue={initialTransfer?.description ?? ''}
          placeholder="Optional"
          className={fieldClass}
        />
      </Field>

      {!hasEnoughAccounts && (
        <p className="border-l-2 border-black pl-3 text-sm text-neutral-600">
          Add at least two accounts in{' '}
          <Link
            href="/settings"
            className="text-black underline underline-offset-4 hover:text-neutral-600"
          >
            Settings
          </Link>{' '}
          to record transfers.
        </p>
      )}

      <Button
        type="submit"
        disabled={isPending || !hasEnoughAccounts}
        className="w-full"
      >
        {initialTransfer ? 'Save changes' : 'Transfer'}
      </Button>
    </form>
  );
}
