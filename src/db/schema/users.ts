import { pgTable, uuid, text, char, numeric, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'),
  currencyCode: char('currency_code', { length: 3 }).notNull().default('BDT'),
  currencySymbol: text('currency_symbol').notNull().default('Tk'),
  openingCashBalance: numeric('opening_cash_balance', { precision: 14, scale: 2 })
    .notNull()
    .default('0.00'),
  openingSavingsBalance: numeric('opening_savings_balance', {
    precision: 14,
    scale: 2,
  })
    .notNull()
    .default('0.00'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
