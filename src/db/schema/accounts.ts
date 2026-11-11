import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  integer,
  date,
  timestamp,
  index,
  unique,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { accountTypeEnum } from './enums';
import { users } from './users';

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    type: accountTypeEnum('type').notNull(),
    openingBalance: numeric('opening_balance', { precision: 14, scale: 2 })
      .notNull()
      .default('0.00'),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('accounts_user_name_idx').on(table.userId, table.name)]
);

export const accountTransfers = pgTable(
  'account_transfers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    transferDate: date('transfer_date').notNull(),
    fromAccountId: uuid('from_account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    toAccountId: uuid('to_account_id')
      .notNull()
      .references(() => accounts.id, { onDelete: 'restrict' }),
    amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
    feeAmount: numeric('fee_amount', { precision: 14, scale: 2 })
      .notNull()
      .default('0.00'),
    description: text('description'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_transfers_user_date').on(table.userId, table.transferDate),
    check('chk_transfer_amount_pos', sql`${table.amount} > 0`),
    check(
      'chk_diff_accounts',
      sql`${table.fromAccountId} <> ${table.toAccountId}`
    ),
  ]
);
