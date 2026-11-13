import type { BudgetItemType } from '@/types/ledger';

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isUuid(value: string): boolean {
  return UUID_REGEX.test(value);
}

/** Strict YYYY-MM-DD check that rejects nonexistent calendar dates such as Feb 31. */
export function isIsoDate(value: string): boolean {
  const match = ISO_DATE_REGEX.exec(value);
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export interface ParsedTransactionInput {
  transactionDate: string;
  categoryId: string;
  accountId: string | null;
  savingsFundId: string | null;
  amount: string;
  description: string | null;
}

export function parseTransactionInput(
  formData: FormData
): ParsedTransactionInput | null {
  const transactionDate = String(formData.get('transactionDate') || '').trim();
  const categoryId = String(formData.get('categoryId') || '').trim();
  const accountIdRaw = String(formData.get('accountId') || '').trim();
  const savingsFundIdRaw = String(formData.get('savingsFundId') || '').trim();
  const amountRaw = String(formData.get('amount') || '').trim();
  const descriptionRaw = String(formData.get('description') || '').trim();

  const amountNum = parseFloat(amountRaw);
  if (
    !isIsoDate(transactionDate) ||
    !isUuid(categoryId) ||
    (accountIdRaw && !isUuid(accountIdRaw)) ||
    (savingsFundIdRaw && !isUuid(savingsFundIdRaw)) ||
    !Number.isFinite(amountNum) ||
    amountNum <= 0
  ) {
    return null;
  }

  return {
    transactionDate,
    categoryId,
    accountId: accountIdRaw || null,
    savingsFundId: savingsFundIdRaw || null,
    amount: amountNum.toFixed(2),
    description: descriptionRaw || null,
  };
}

export interface ParsedTransferInput {
  transferDate: string;
  fromAccountId: string;
  toAccountId: string;
  amount: string;
  feeAmount: string;
  description: string | null;
}

export function parseTransferInput(
  formData: FormData
): ParsedTransferInput | null {
  const transferDate = String(formData.get('transferDate') || '').trim();
  const fromAccountId = String(formData.get('fromAccountId') || '').trim();
  const toAccountId = String(formData.get('toAccountId') || '').trim();
  const amountRaw = String(formData.get('amount') || '').trim();
  const feeAmountRaw = String(formData.get('feeAmount') || '0').trim();
  const descriptionRaw = String(formData.get('description') || '').trim();

  const amountNum = parseFloat(amountRaw);
  const feeNum = parseFloat(feeAmountRaw || '0');

  if (
    !isIsoDate(transferDate) ||
    !isUuid(fromAccountId) ||
    !isUuid(toAccountId) ||
    fromAccountId === toAccountId ||
    !Number.isFinite(amountNum) ||
    amountNum <= 0 ||
    !Number.isFinite(feeNum) ||
    feeNum < 0
  ) {
    return null;
  }

  return {
    transferDate,
    fromAccountId,
    toAccountId,
    amount: amountNum.toFixed(2),
    feeAmount: feeNum.toFixed(2),
    description: descriptionRaw || null,
  };
}

export interface ParsedBudgetItemInput {
  budgetMonth: string;
  itemType: BudgetItemType;
  targetId: string;
  plannedAmount: string;
}

export function parseBudgetItemInput(
  formData: FormData
): ParsedBudgetItemInput | null {
  const budgetMonth = String(formData.get('budgetMonth') || '').trim();
  const itemType = String(formData.get('itemType') || '').trim() as BudgetItemType;
  const targetId = String(formData.get('targetId') || '').trim();
  const plannedAmountRaw = String(formData.get('plannedAmount') || '0').trim();
  const plannedNum = parseFloat(plannedAmountRaw);

  if (
    !isIsoDate(budgetMonth) ||
    !['INCOME', 'SPENDING', 'SAVINGS'].includes(itemType) ||
    !isUuid(targetId) ||
    !Number.isFinite(plannedNum) ||
    plannedNum < 0
  ) {
    return null;
  }

  return {
    budgetMonth,
    itemType,
    targetId,
    plannedAmount: plannedNum.toFixed(2),
  };
}
