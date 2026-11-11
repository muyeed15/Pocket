import {
  pgTable,
  uuid,
  numeric,
  date,
  timestamp,
  index,
  unique,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { budgetItemTypeEnum } from './enums';
import { users } from './users';
import { budgetGroups, categories, savingsFunds } from './categories';

export const monthlyBudgetItems = pgTable(
  'monthly_budget_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    budgetMonth: date('budget_month').notNull(),
    itemType: budgetItemTypeEnum('item_type').notNull(),
    categoryId: uuid('category_id').references(() => categories.id, {
      onDelete: 'cascade',
    }),
    budgetGroupId: uuid('budget_group_id').references(() => budgetGroups.id, {
      onDelete: 'cascade',
    }),
    savingsFundId: uuid('savings_fund_id').references(() => savingsFunds.id, {
      onDelete: 'cascade',
    }),
    plannedAmount: numeric('planned_amount', { precision: 14, scale: 2 })
      .notNull()
      .default('0.00'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index('idx_budget_user_month').on(table.userId, table.budgetMonth),
    unique('monthly_budget_items_unique_target')
      .on(
        table.userId,
        table.budgetMonth,
        table.itemType,
        table.categoryId,
        table.budgetGroupId,
        table.savingsFundId
      )
      .nullsNotDistinct(),
    check('chk_planned_amount_non_neg', sql`${table.plannedAmount} >= 0`),
    check(
      'chk_budget_target',
      sql`(
        (${table.itemType} = 'INCOME' AND ${table.categoryId} IS NOT NULL AND ${table.budgetGroupId} IS NULL AND ${table.savingsFundId} IS NULL) OR
        (${table.itemType} = 'SPENDING' AND ${table.budgetGroupId} IS NOT NULL AND ${table.categoryId} IS NULL AND ${table.savingsFundId} IS NULL) OR
        (${table.itemType} = 'SAVINGS' AND ${table.savingsFundId} IS NOT NULL AND ${table.categoryId} IS NULL AND ${table.budgetGroupId} IS NULL)
      )`
    ),
  ]
);
