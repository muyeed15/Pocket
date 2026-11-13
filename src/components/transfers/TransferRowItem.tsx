'use client';

import React from 'react';
import { IoCreateOutline } from 'react-icons/io5';
import { formatTk } from '@/lib/format';
import { IconButton } from '@/components/ui/Button';
import {
  ConfirmDeleteButton,
  ROW_ACTIONS_CLASS,
} from '@/components/ui/ConfirmDeleteButton';
import { useCurrencySymbol } from '@/components/ui/CurrencyContext';
import type { TransferRow } from '@/types/ledger';

interface TransferRowItemProps {
  transfer: TransferRow;
  variant?: 'transfer' | 'charge';
  accountPerspectiveId?: string | 'ALL';
  subtitlePrefix?: string;
  isPending: boolean;
  onEdit?: (tr: TransferRow) => void;
  onDelete?: (id: string) => void;
}

/** Shared transfer row rendered across Ledger (service charges) and Transfers pages. */
export function TransferRowItem({
  transfer,
  variant = 'transfer',
  accountPerspectiveId = 'ALL',
  subtitlePrefix,
  isPending,
  onEdit,
  onDelete,
}: TransferRowItemProps) {
  const symbol = useCurrencySymbol();
  const isCharge = variant === 'charge';
  const isIncoming =
    !isCharge &&
    accountPerspectiveId !== 'ALL' &&
    transfer.toAccountId === accountPerspectiveId;
  const isOutgoing =
    !isCharge &&
    accountPerspectiveId !== 'ALL' &&
    transfer.fromAccountId === accountPerspectiveId;

  const title = isCharge
    ? transfer.description
      ? `Service charge · ${transfer.description}`
      : 'Service charge'
    : `${transfer.fromAccountName} to ${transfer.toAccountName}`;

  const directionLabel = isIncoming
    ? 'Received'
    : isOutgoing
      ? 'Sent'
      : undefined;
  const subtitle = isCharge
    ? `Transfer, ${transfer.fromAccountName} to ${transfer.toAccountName}`
    : [subtitlePrefix ?? directionLabel, transfer.description]
        .filter(Boolean)
        .join(' · ');

  const primaryAmount = isCharge
    ? formatTk(-transfer.feeAmount, { showSign: true, symbol })
    : isIncoming
      ? formatTk(transfer.amount, { showSign: true, symbol })
      : isOutgoing
        ? formatTk(-transfer.amount, { showSign: true, symbol })
        : formatTk(transfer.amount, { symbol });

  const feeText = isIncoming
    ? `Service charge ${formatTk(transfer.feeAmount, { symbol })} (sender)`
    : `Service charge -${formatTk(transfer.feeAmount, { symbol })}`;

  return (
    <li className="group flex items-center gap-3 py-4">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[17px]">{title}</p>
        {subtitle && (
          <p className="truncate text-sm text-neutral-500">{subtitle}</p>
        )}
      </div>

      <div className="shrink-0 text-right tabular-nums">
        <span className="block whitespace-nowrap text-[17px]">
          {primaryAmount}
        </span>
        {!isCharge && transfer.feeAmount > 0 && (
          <span className="block whitespace-nowrap text-xs text-neutral-500">
            {feeText}
          </span>
        )}
      </div>

      {(onEdit || onDelete) && (
        <div className={`${ROW_ACTIONS_CLASS} sm:min-w-[76px] sm:justify-end`}>
          {onEdit && (
            <IconButton
              label="Edit transfer"
              disabled={isPending}
              onClick={() => onEdit(transfer)}
            >
              <IoCreateOutline />
            </IconButton>
          )}
          {onDelete && (
            <ConfirmDeleteButton
              label="Delete transfer"
              confirmLabel="Confirm delete transfer"
              disabled={isPending}
              onConfirm={() => onDelete(transfer.id)}
            />
          )}
        </div>
      )}
    </li>
  );
}
