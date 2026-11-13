import { after, before, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { eq, sql } from 'drizzle-orm';
import { db } from '@/db';
import * as schema from '@/db/schema';
import { hashPassword } from '@/lib/session';

describe('PostgreSQL schema & views integration', () => {
  let testUserId: string;
  let cashAccountId: string;
  let bankAccountId: string;
  let essentialsGroupId: string;
  let emergencyFundId: string;
  let incomeCatId: string;
  let expenseCatId: string;
  let savingsCatId: string;

  before(async () => {
    const email = `unit-test-${Date.now()}@pocket.local`;
    const [user] = await db
      .insert(schema.users)
      .values({
        name: 'Unit Test User',
        email,
        passwordHash: hashPassword('test-password-123'),
        openingCashBalance: '1000.00',
        openingSavingsBalance: '200.00',
      })
      .returning({ id: schema.users.id });
    testUserId = user.id;

    const [cashAcc, bankAcc] = await db
      .insert(schema.accounts)
      .values([
        { userId: testUserId, name: 'Cash', type: 'CASH', openingBalance: '600.00' },
        { userId: testUserId, name: 'Bank', type: 'BANK', openingBalance: '400.00' },
      ])
      .returning({ id: schema.accounts.id });
    cashAccountId = cashAcc.id;
    bankAccountId = bankAcc.id;

    const [bg] = await db
      .insert(schema.budgetGroups)
      .values({ userId: testUserId, name: 'Essentials' })
      .returning({ id: schema.budgetGroups.id });
    essentialsGroupId = bg.id;

    const [sf] = await db
      .insert(schema.savingsFunds)
      .values({ userId: testUserId, name: 'Emergency', openingBalance: '200.00' })
      .returning({ id: schema.savingsFunds.id });
    emergencyFundId = sf.id;

    const [inc, exp, sav] = await db
      .insert(schema.categories)
      .values([
        { userId: testUserId, name: 'Salary', flowType: 'INCOME' },
        {
          userId: testUserId,
          name: 'Groceries',
          flowType: 'EXPENSE',
          budgetGroupId: essentialsGroupId,
        },
        {
          userId: testUserId,
          name: 'Save',
          flowType: 'SAVINGS_DEPOSIT',
          defaultSavingsFundId: emergencyFundId,
        },
      ])
      .returning({ id: schema.categories.id });
    incomeCatId = inc.id;
    expenseCatId = exp.id;
    savingsCatId = sav.id;
  });

  after(async () => {
    if (testUserId) {
      await db.delete(schema.transactions).where(eq(schema.transactions.userId, testUserId));
      await db.delete(schema.accountTransfers).where(eq(schema.accountTransfers.userId, testUserId));
      await db.delete(schema.monthlyBudgetItems).where(eq(schema.monthlyBudgetItems.userId, testUserId));
      await db.delete(schema.categories).where(eq(schema.categories.userId, testUserId));
      await db.delete(schema.savingsFunds).where(eq(schema.savingsFunds.userId, testUserId));
      await db.delete(schema.budgetGroups).where(eq(schema.budgetGroups.userId, testUserId));
      await db.delete(schema.accounts).where(eq(schema.accounts.userId, testUserId));
      await db.delete(schema.users).where(eq(schema.users.id, testUserId));
    }
    await db.$client.end();
  });

  it('computes running balances, account balances, savings balances, and budget progress in SQL views', async () => {
    await db.insert(schema.transactions).values([
      {
        userId: testUserId,
        transactionDate: '2026-11-01',
        categoryId: incomeCatId,
        accountId: bankAccountId,
        amount: '500.00',
        description: 'Paycheck',
      },
      {
        userId: testUserId,
        transactionDate: '2026-11-02',
        categoryId: expenseCatId,
        accountId: cashAccountId,
        amount: '150.00',
        description: 'Market',
      },
      {
        userId: testUserId,
        transactionDate: '2026-11-03',
        categoryId: savingsCatId,
        accountId: bankAccountId,
        amount: '100.00',
        description: 'Monthly save',
      },
    ]);

    await db.insert(schema.accountTransfers).values({
      userId: testUserId,
      transferDate: '2026-11-04',
      fromAccountId: bankAccountId,
      toAccountId: cashAccountId,
      amount: '200.00',
      feeAmount: '0.00',
    });

    await db.insert(schema.monthlyBudgetItems).values({
      userId: testUserId,
      budgetMonth: '2026-11-01',
      itemType: 'SPENDING',
      budgetGroupId: essentialsGroupId,
      plannedAmount: '300.00',
    });

    const ledgerRes = await db.execute(sql`
      SELECT running_cash_balance, running_savings_balance
      FROM v_transaction_ledger
      WHERE user_id = ${testUserId}
      ORDER BY transaction_date DESC, entry_sequence DESC
      LIMIT 1
    `);
    const latest = ledgerRes.rows[0] as Record<string, unknown>;
    // 1000 opening + 500 income - 150 expense - 100 savings deposit = 1250
    assert.equal(Number(latest.running_cash_balance), 1250);
    // 200 opening + 100 savings deposit = 300
    assert.equal(Number(latest.running_savings_balance), 300);

    const accRes = await db.execute(sql`
      SELECT account_name, current_balance
      FROM v_account_balances
      WHERE user_id = ${testUserId}
      ORDER BY account_name ASC
    `);
    const byName = new Map(
      (accRes.rows as Array<Record<string, unknown>>).map((r) => [
        String(r.account_name),
        Number(r.current_balance),
      ])
    );
    // Bank: 400 + 500 - 200 transfer = 700
    assert.equal(byName.get('Bank'), 700);
    // Cash: 600 - 150 + 200 transfer = 650
    assert.equal(byName.get('Cash'), 650);

    const sfRes = await db.execute(sql`
      SELECT current_balance
      FROM v_savings_fund_balances
      WHERE user_id = ${testUserId}
    `);
    assert.equal(Number((sfRes.rows[0] as Record<string, unknown>).current_balance), 300);

    const budgetRes = await db.execute(sql`
      SELECT actual_amount, remaining_amount, used_percentage
      FROM v_monthly_budget_progress
      WHERE user_id = ${testUserId}
    `);
    const bRow = budgetRes.rows[0] as Record<string, unknown>;
    assert.equal(Number(bRow.actual_amount), 150);
    assert.equal(Number(bRow.remaining_amount), 150);
    assert.equal(Number(bRow.used_percentage), 50);
  });

  it('enforces database check constraints on invalid amounts and same-account transfers', async () => {
    await assert.rejects(
      db.insert(schema.transactions).values({
        userId: testUserId,
        transactionDate: '2026-11-05',
        categoryId: expenseCatId,
        accountId: cashAccountId,
        amount: '-10.00',
      })
    );

    await assert.rejects(
      db.insert(schema.accountTransfers).values({
        userId: testUserId,
        transferDate: '2026-11-05',
        fromAccountId: cashAccountId,
        toAccountId: cashAccountId,
        amount: '50.00',
      })
    );
  });
});
