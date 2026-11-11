import type { AccountType, ActiveTab, FlowType } from '@/types/ledger';

export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
] as const;

export const TABS: Array<{ id: ActiveTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'transactions', label: 'Ledger' },
  { id: 'budget', label: 'Budget' },
  { id: 'accounts', label: 'Accounts' },
  { id: 'summary', label: 'Year' },
];

export const FLOW_TYPE_LABELS: Record<FlowType, string> = {
  INCOME: 'Income',
  EXPENSE: 'Expense',
  BORROWING: 'Borrowing',
  DEBT_PAYMENT: 'Debt payment',
  TRANSFER_IN: 'Transfer in',
  TRANSFER_OUT: 'Transfer out',
  UNTRACKED_IN: 'Untracked in',
  UNTRACKED_OUT: 'Untracked out',
  SAVINGS_DEPOSIT: 'Savings deposit',
  SAVINGS_WITHDRAWAL: 'Savings withdrawal',
};

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: 'Cash',
  BANK: 'Bank',
  MFS: 'Mobile wallet',
};

/** Monochrome tones shared by every chart. */
export const TONES = {
  primary: '#000000',
  secondary: '#5c5c5c',
  tertiary: '#a8a8a8',
  track: '#efefef',
} as const;
