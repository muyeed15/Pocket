import { pgEnum } from 'drizzle-orm/pg-core';

export const accountTypeEnum = pgEnum('account_type', [
  'CASH',
  'BANK',
  'MFS',
]);

export const flowTypeEnum = pgEnum('flow_type', [
  'INCOME',
  'EXPENSE',
  'BORROWING',
  'DEBT_PAYMENT',
  'TRANSFER_IN',
  'TRANSFER_OUT',
  'UNTRACKED_IN',
  'UNTRACKED_OUT',
  'SAVINGS_DEPOSIT',
  'SAVINGS_WITHDRAWAL',
]);

export const budgetItemTypeEnum = pgEnum('budget_item_type', [
  'INCOME',
  'SPENDING',
  'SAVINGS',
]);
