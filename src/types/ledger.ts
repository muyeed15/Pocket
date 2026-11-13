export type FlowType =
  | 'INCOME'
  | 'EXPENSE'
  | 'BORROWING'
  | 'DEBT_PAYMENT'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'UNTRACKED_IN'
  | 'UNTRACKED_OUT'
  | 'SAVINGS_DEPOSIT'
  | 'SAVINGS_WITHDRAWAL';

export type AccountType = 'CASH' | 'BANK' | 'MFS';

export type BudgetItemType = 'INCOME' | 'SPENDING' | 'SAVINGS';

export type ActiveTab =
  | 'overview'
  | 'transactions'
  | 'budget'
  | 'accounts'
  | 'transfers'
  | 'summary';

export type SettingsTab =
  | 'preferences'
  | 'categories'
  | 'accounts'
  | 'planning';

export interface LedgerUser {
  id: string;
  name: string;
  email: string;
  currencySymbol: string;
  openingCashBalance: number;
  openingSavingsBalance: number;
}

export interface LedgerTransactionRow {
  id: string;
  entrySequence: number;
  transactionDate: string;
  description: string | null;
  amount: number;
  legacyCategory: string | null;
  categoryId: string;
  categoryName: string;
  flowType: FlowType;
  budgetGroupId: string | null;
  budgetGroupName: string;
  savingsFundId: string | null;
  savingsFundName: string | null;
  accountId: string | null;
  accountName: string | null;
  cashChange: number;
  runningCashBalance: number;
  savingsChange: number;
  runningSavingsBalance: number;
}

export interface AccountBalanceRow {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  sortOrder: number;
  openingBalance: number;
  moneyIn: number;
  moneyOut: number;
  currentBalance: number;
}

export interface SavingsFundBalanceRow {
  savingsFundId: string;
  savingsFundName: string;
  sortOrder: number;
  openingBalance: number;
  totalDeposits: number;
  totalWithdrawals: number;
  currentBalance: number;
}

export interface BudgetProgressRow {
  id: string;
  budgetMonth: string;
  itemType: BudgetItemType;
  targetId: string;
  targetName: string;
  plannedAmount: number;
  actualAmount: number;
  remainingAmount: number;
  usedPercentage: number | null;
}

export interface MonthlySummaryRow {
  monthIndex: number; // 1..12
  monthName: string;
  income: number;
  spending: number;
  borrowed: number;
  debtPaid: number;
  transfersNet: number;
  transferFees: number;
  untrackedNet: number;
  saved: number;
  savingsUsed: number;
  cashChange: number;
  cashBalance: number;
  savingsBalance: number;
  totalBalance: number;
  plannedIncome: number;
  plannedSpending: number;
  plannedSavings: number;
}

export interface CategoryOption {
  id: string;
  name: string;
  flowType: FlowType;
  budgetGroupId: string | null;
  budgetGroupName: string | null;
  defaultSavingsFundId: string | null;
}

export interface BudgetGroupOption {
  id: string;
  name: string;
}

export interface TransferRow {
  id: string;
  transferDate: string;
  fromAccountId: string;
  fromAccountName: string;
  toAccountId: string;
  toAccountName: string;
  amount: number;
  feeAmount: number;
  description: string | null;
}

export interface ReconciliationSummary {
  totalHeldInAccounts: number;
  ledgerCashBalance: number;
  difference: number;
}

export interface GroupSpending {
  name: string;
  amount: number;
}

export interface MonthInsights {
  /** Expense total per calendar day of the selected month. */
  dailySpending: number[];
  /** Closing cash balance per day, up to the last day with activity. */
  dailyBalance: number[];
  /** Expense totals per category, largest first. */
  spendingByGroup: GroupSpending[];
}

export interface LedgerSnapshot {
  selectedYear: number;
  selectedMonth: number; // 1..12
  insights: MonthInsights;
  user: LedgerUser;
  accounts: AccountBalanceRow[];
  savingsFunds: SavingsFundBalanceRow[];
  budgetGroups: BudgetGroupOption[];
  categories: CategoryOption[];
  transactions: LedgerTransactionRow[];
  transfers: TransferRow[];
  budgetItems: BudgetProgressRow[];
  monthlySummary: MonthlySummaryRow[];
  reconciliation: ReconciliationSummary;
}

export interface CategorySettingRow {
  id: string;
  name: string;
  flowType: FlowType;
  budgetGroupId: string | null;
  budgetGroupName: string | null;
  defaultSavingsFundId: string | null;
  defaultSavingsFundName: string | null;
  usageCount: number;
}

export interface BudgetGroupSettingRow {
  id: string;
  name: string;
  sortOrder: number;
  usageCount: number;
}

export interface SavingsFundSettingRow {
  id: string;
  name: string;
  openingBalance: number;
  sortOrder: number;
  usageCount: number;
}

export interface AccountSettingRow {
  id: string;
  name: string;
  type: AccountType;
  openingBalance: number;
  sortOrder: number;
  usageCount: number;
}

export interface SettingsSnapshot {
  user: {
    id: string;
    name: string;
    email: string;
    currencyCode: string;
    currencySymbol: string;
    openingCashBalance: number;
    openingSavingsBalance: number;
  };
  categories: CategorySettingRow[];
  budgetGroups: BudgetGroupSettingRow[];
  savingsFunds: SavingsFundSettingRow[];
  accounts: AccountSettingRow[];
}
