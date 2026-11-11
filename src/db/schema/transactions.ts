import {
  pgTable,
  uuid,
  text,
  numeric,
  serial,
  date,
  timestamp,
  index,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';
import { accounts } from './accounts';
import { categories, savingsFunds } from './categories';

export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    entrySequence: serial('entry_sequence').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    transactionDate: date('transaction_date').notNull(),
    categoryId: uuid('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'restrict' }),
    accountId: uuid('account_id').references(() => accounts.id, {
      onDelete: 'restrict',
    }),
    savingsFundId: uuid('savings_fund_id').references(() => savingsFunds.id, {
      onDelete: 'restrict',
    }),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    description: text('description'),
    legacyCategory: text('legacy_category'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_transactions_user_date').on(
      table.userId,
      table.transactionDate,
      table.entrySequence
    ),
    index('idx_transactions_category').on(table.categoryId),
    index('idx_transactions_account').on(table.accountId),
    index('idx_transactions_savings_fund').on(table.savingsFundId),
    check('chk_transaction_amount_pos', sql`${table.amount} > 0`),
  ]
);
