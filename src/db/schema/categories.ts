import {
  pgTable,
  uuid,
  text,
  numeric,
  boolean,
  integer,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';
import { flowTypeEnum } from './enums';
import { users } from './users';

export const budgetGroups = pgTable(
  'budget_groups',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('budget_groups_user_name_idx').on(table.userId, table.name),
  ]
);

export const savingsFunds = pgTable(
  'savings_funds',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    openingBalance: numeric('opening_balance', { precision: 14, scale: 2 })
      .notNull()
      .default('0.00'),
    targetAmount: numeric('target_amount', { precision: 14, scale: 2 }),
    isActive: boolean('is_active').notNull().default(true),
    sortOrder: integer('sort_order').notNull().default(0),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    unique('savings_funds_user_name_idx').on(table.userId, table.name),
  ]
);

export const categories = pgTable(
  'categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    flowType: flowTypeEnum('flow_type').notNull(),
    budgetGroupId: uuid('budget_group_id').references(() => budgetGroups.id, {
      onDelete: 'set null',
    }),
    defaultSavingsFundId: uuid('default_savings_fund_id').references(
      () => savingsFunds.id,
      { onDelete: 'set null' }
    ),
    isActive: boolean('is_active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique('categories_user_name_idx').on(table.userId, table.name)]
);
