import { execFileSync } from 'child_process';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

dotenv.config({ path: '.env.local' });

const DEFAULT_EXCEL_PATH =
  '/Users/muyeed/Sync/Documents/Personal/Accounting/Money Ledger 2026.xlsx';

interface ParsedExcelData {
  dashboard: {
    selectedYear: number;
    selectedMonth: string;
    openingCash: string;
    openingSavings: string;
    currencySymbol: string;
  };
  accounts: Array<{
    type: string;
    name: string;
    openingBalance: string;
  }>;
  savingsFunds: Array<{
    name: string;
  }>;
  categories: Array<{
    name: string;
    flowType: string;
    budgetGroup: string;
  }>;
  transactions: Array<{
    rowNumber: number;
    date: string;
    category: string;
    description: string | null;
    amount: string;
    savingsFund: string | null;
    account: string | null;
    legacyCategory: string | null;
  }>;
  transfers: Array<{
    date: string;
    fromAccount: string;
    toAccount: string;
    amount: string;
    description: string | null;
  }>;
  budgets: Array<{
    budgetMonth: string;
    type: string;
    targetName: string;
    plannedAmount: string;
  }>;
}

function extractExcelData(excelPath: string): ParsedExcelData {
  const pythonScript = `
import zipfile, xml.etree.ElementTree as ET, re, datetime, json, sys
from decimal import Decimal, ROUND_HALF_UP

path = sys.argv[1]
with zipfile.ZipFile(path, 'r') as z:
    shared_strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        root = ET.fromstring(z.read('xl/sharedStrings.xml'))
        ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        for si in root.findall('s:si', ns):
            shared_strings.append(''.join(t.text or '' for t in si.findall('.//s:t', ns)))

    wb_root = ET.fromstring(z.read('xl/workbook.xml'))
    ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    rels = {rel.attrib['Id']: rel.attrib['Target'] for rel in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
    sheets = {sh.attrib['name']: 'xl/' + rels[sh.attrib['{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id']].lstrip('/') for sh in wb_root.findall('.//s:sheet', ns)}

    def get_rows(sheet_name):
        root = ET.fromstring(z.read(sheets[sheet_name]))
        res = []
        for row in root.findall('.//s:row', ns):
            r_num = int(row.attrib.get('r', 0))
            vals, forms = {}, {}
            for c in row.findall('s:c', ns):
                col = re.sub(r'\\d+', '', c.attrib.get('r', ''))
                t = c.attrib.get('t', '')
                v_el = c.find('s:v', ns)
                f_el = c.find('s:f', ns)
                is_el = c.find('s:is', ns)
                val = v_el.text if v_el is not None else None
                if t == 's' and val is not None:
                    val = shared_strings[int(val)]
                elif t == 'inlineStr' and is_el is not None:
                    val = ''.join(x.text or '' for x in is_el.findall('.//s:t', ns))
                if val is not None and val != '':
                    vals[col] = val.strip() if isinstance(val, str) else val
                if f_el is not None and f_el.text:
                    forms[col] = f_el.text
            if vals:
                res.append((r_num, vals, forms))
        return res

    def excel_date(serial):
        return (datetime.date(1899, 12, 30) + datetime.timedelta(days=int(float(serial)))).isoformat()

    def fmt_dec(val):
        if val is None or val == '':
            return '0.00'
        return str(Decimal(str(val)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))

    # 1. Dashboard
    dash_rows = {r: v for r, v, _ in get_rows('Dashboard')}
    dashboard = {
        'selectedYear': int(float(dash_rows.get(3, {}).get('B', 2026))),
        'openingCash': fmt_dec(dash_rows.get(4, {}).get('B', '0')),
        'selectedMonth': dash_rows.get(5, {}).get('B', 'November'),
        'openingSavings': fmt_dec(dash_rows.get(6, {}).get('B', '0')),
        'currencySymbol': dash_rows.get(7, {}).get('B', 'Tk'),
    }

    # 2. Accounts
    accounts = []
    for r, v, f in get_rows('Accounts'):
        if r >= 2 and 'A' in v and 'B' in v and v['A'] != 'Total':
            accounts.append({
                'type': v['A'],
                'name': v['B'],
                'openingBalance': fmt_dec(v.get('C', '0')),
            })

    # 3. Savings Funds
    savings_funds = []
    for r, v, f in get_rows('Savings Funds'):
        if r >= 2 and 'A' in v:
            savings_funds.append({'name': v['A']})

    # 4. Categories
    categories = []
    for r, v, f in get_rows('Categories'):
        if r >= 2 and 'A' in v and 'B' in v:
            categories.append({
                'name': v['A'],
                'flowType': v['B'],
                'budgetGroup': v.get('C', 'Not budgeted'),
            })

    # 5. Transactions
    transactions = []
    for r, v, f in get_rows('Transactions'):
        if r >= 2 and 'A' in v and 'B' in v and 'D' in v:
            transactions.append({
                'rowNumber': r,
                'date': excel_date(v['A']),
                'category': v['B'],
                'description': v.get('C'),
                'amount': fmt_dec(v['D']),
                'savingsFund': v.get('E'),
                'account': v.get('F'),
                'legacyCategory': v.get('Q'),
            })

    # 6. Transfers
    transfers = []
    for r, v, f in get_rows('Transfers'):
        if r >= 2 and 'A' in v and 'B' in v and 'C' in v and 'D' in v:
            transfers.append({
                'date': excel_date(v['A']),
                'fromAccount': v['B'],
                'toAccount': v['C'],
                'amount': fmt_dec(v['D']),
                'description': v.get('E'),
            })

    # 7. Budget
    budgets = []
    for r, v, f in get_rows('Budget'):
        if r >= 5 and 'A' in v and 'B' in v and 'C' in v and 'D' in v:
            budgets.append({
                'budgetMonth': excel_date(v['A']),
                'type': v['B'],
                'targetName': v['C'],
                'plannedAmount': fmt_dec(v['D']),
            })

    print(json.dumps({
        'dashboard': dashboard,
        'accounts': accounts,
        'savingsFunds': savings_funds,
        'categories': categories,
        'transactions': transactions,
        'transfers': transfers,
        'budgets': budgets,
    }))
`;

  const stdout = execFileSync('python3', ['-c', pythonScript, excelPath], {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });
  return JSON.parse(stdout) as ParsedExcelData;
}

const ACCOUNT_TYPE_MAP: Record<string, (typeof schema.accountTypeEnum.enumValues)[number]> = {
  Cash: 'CASH',
  Bank: 'BANK',
  MFS: 'MFS',
};

const FLOW_TYPE_MAP: Record<string, (typeof schema.flowTypeEnum.enumValues)[number]> = {
  Income: 'INCOME',
  Expense: 'EXPENSE',
  Borrowing: 'BORROWING',
  'Debt payment': 'DEBT_PAYMENT',
  'Transfer in': 'TRANSFER_IN',
  'Transfer out': 'TRANSFER_OUT',
  'Untracked in': 'UNTRACKED_IN',
  'Untracked out': 'UNTRACKED_OUT',
  'Savings deposit': 'SAVINGS_DEPOSIT',
  'Savings withdrawal': 'SAVINGS_WITHDRAWAL',
};

const BUDGET_TYPE_MAP: Record<string, (typeof schema.budgetItemTypeEnum.enumValues)[number]> = {
  Income: 'INCOME',
  Spending: 'SPENDING',
  Savings: 'SAVINGS',
};

async function main() {
  const excelPath = process.argv[2] || DEFAULT_EXCEL_PATH;
  console.log(`Reading Excel workbook from: ${excelPath}`);
  const data = extractExcelData(excelPath);

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  const db = drizzle(pool, { schema });

  try {
    await db.transaction(async (tx) => {
      // Clear existing data so migration is idempotent
      await tx.delete(schema.monthlyBudgetItems);
      await tx.delete(schema.accountTransfers);
      await tx.delete(schema.transactions);
      await tx.delete(schema.categories);
      await tx.delete(schema.budgetGroups);
      await tx.delete(schema.savingsFunds);
      await tx.delete(schema.accounts);
      await tx.delete(schema.users);

      // Reset transaction sequence so entry_sequence starts at 1
      await tx.execute(sql`ALTER SEQUENCE transactions_entry_sequence_seq RESTART WITH 1`);

      // 1. Insert default User
      const [user] = await tx
        .insert(schema.users)
        .values({
          name: 'Muyeed',
          email: 'muyeed@pocket.local',
          currencyCode: 'BDT',
          currencySymbol: data.dashboard.currencySymbol,
          openingCashBalance: data.dashboard.openingCash,
          openingSavingsBalance: data.dashboard.openingSavings,
        })
        .returning();

      // 2. Insert Accounts
      const accountMap = new Map<string, string>();
      for (let i = 0; i < data.accounts.length; i++) {
        const acc = data.accounts[i];
        const mappedType = ACCOUNT_TYPE_MAP[acc.type];
        if (!mappedType) {
          throw new Error(`Unknown account type: ${acc.type}`);
        }
        const [inserted] = await tx
          .insert(schema.accounts)
          .values({
            userId: user.id,
            name: acc.name,
            type: mappedType,
            openingBalance: acc.openingBalance,
            sortOrder: i + 1,
          })
          .returning();
        accountMap.set(acc.name, inserted.id);
      }

      // 3. Insert Savings Funds
      const savingsFundMap = new Map<string, string>();
      for (let i = 0; i < data.savingsFunds.length; i++) {
        const sf = data.savingsFunds[i];
        const [inserted] = await tx
          .insert(schema.savingsFunds)
          .values({
            userId: user.id,
            name: sf.name,
            openingBalance: '0.00',
            sortOrder: i + 1,
          })
          .returning();
        savingsFundMap.set(sf.name, inserted.id);
      }

      // 4. Insert Budget Groups (excluding "Not budgeted" and Savings Fund names)
      const uniqueBudgetGroups = Array.from(
        new Set(
          data.categories
            .map((c) => c.budgetGroup)
            .filter((bg) => bg && bg !== 'Not budgeted' && !savingsFundMap.has(bg))
        )
      ).sort();

      const budgetGroupMap = new Map<string, string>();
      for (let i = 0; i < uniqueBudgetGroups.length; i++) {
        const bgName = uniqueBudgetGroups[i];
        const [inserted] = await tx
          .insert(schema.budgetGroups)
          .values({
            userId: user.id,
            name: bgName,
            sortOrder: i + 1,
          })
          .returning();
        budgetGroupMap.set(bgName, inserted.id);
      }

      // 5. Insert Categories (153 categories)
      const categoryMap = new Map<
        string,
        { id: string; flowType: string; defaultSavingsFundId: string | null }
      >();
      for (const cat of data.categories) {
        const mappedFlow = FLOW_TYPE_MAP[cat.flowType];
        if (!mappedFlow) {
          throw new Error(`Unknown flow type: ${cat.flowType}`);
        }
        const budgetGroupId = budgetGroupMap.get(cat.budgetGroup) ?? null;
        const defaultSavingsFundId = savingsFundMap.get(cat.budgetGroup) ?? null;

        const [inserted] = await tx
          .insert(schema.categories)
          .values({
            userId: user.id,
            name: cat.name,
            flowType: mappedFlow,
            budgetGroupId,
            defaultSavingsFundId,
          })
          .returning();

        categoryMap.set(cat.name, {
          id: inserted.id,
          flowType: mappedFlow,
          defaultSavingsFundId,
        });
      }

      // 6. Insert Transactions (142 historical entries in exact row order)
      for (const item of data.transactions) {
        const catInfo = categoryMap.get(item.category);
        if (!catInfo) {
          throw new Error(`Row ${item.rowNumber}: Category not found: ${item.category}`);
        }
        const accountId = item.account ? (accountMap.get(item.account) ?? null) : null;
        if (item.account && !accountId) {
          throw new Error(`Row ${item.rowNumber}: Account not found: ${item.account}`);
        }

        let savingsFundId: string | null = null;
        if (item.savingsFund) {
          savingsFundId = savingsFundMap.get(item.savingsFund) ?? null;
        } else if (
          catInfo.flowType === 'SAVINGS_DEPOSIT' ||
          catInfo.flowType === 'SAVINGS_WITHDRAWAL'
        ) {
          savingsFundId = catInfo.defaultSavingsFundId;
        }

        await tx.insert(schema.transactions).values({
          userId: user.id,
          transactionDate: item.date,
          categoryId: catInfo.id,
          accountId,
          savingsFundId,
          amount: item.amount,
          description: item.description,
          legacyCategory: item.legacyCategory,
        });
      }

      // 7. Insert Account Transfers (if any)
      for (const tr of data.transfers) {
        const fromAccountId = accountMap.get(tr.fromAccount);
        const toAccountId = accountMap.get(tr.toAccount);
        if (!fromAccountId || !toAccountId) {
          throw new Error(
            `Transfer account not found: ${tr.fromAccount} -> ${tr.toAccount}`
          );
        }
        await tx.insert(schema.accountTransfers).values({
          userId: user.id,
          transferDate: tr.date,
          fromAccountId,
          toAccountId,
          amount: tr.amount,
          description: tr.description,
        });
      }

      // 8. Insert Monthly Budget Items
      for (const b of data.budgets) {
        const mappedBudgetType = BUDGET_TYPE_MAP[b.type];
        if (!mappedBudgetType) {
          throw new Error(`Unknown budget item type: ${b.type}`);
        }

        let categoryId: string | null = null;
        let budgetGroupId: string | null = null;
        let savingsFundId: string | null = null;

        if (mappedBudgetType === 'INCOME') {
          categoryId = categoryMap.get(b.targetName)?.id ?? null;
          if (!categoryId) {
            throw new Error(`Income budget category not found: ${b.targetName}`);
          }
        } else if (mappedBudgetType === 'SPENDING') {
          budgetGroupId = budgetGroupMap.get(b.targetName) ?? null;
          if (!budgetGroupId) {
            throw new Error(`Spending budget group not found: ${b.targetName}`);
          }
        } else if (mappedBudgetType === 'SAVINGS') {
          savingsFundId = savingsFundMap.get(b.targetName) ?? null;
          if (!savingsFundId) {
            throw new Error(`Savings budget fund not found: ${b.targetName}`);
          }
        }

        await tx.insert(schema.monthlyBudgetItems).values({
          userId: user.id,
          budgetMonth: b.budgetMonth,
          itemType: mappedBudgetType,
          categoryId,
          budgetGroupId,
          savingsFundId,
          plannedAmount: b.plannedAmount,
        });
      }

      // 9. Create or Replace Helper Views for Ledger & Monthly Summary
      await tx.execute(sql`
        CREATE OR REPLACE VIEW v_transaction_ledger AS
        SELECT
          t.id,
          t.entry_sequence,
          t.user_id,
          t.transaction_date,
          t.description,
          t.amount,
          t.legacy_category,
          c.id AS category_id,
          c.name AS category_name,
          c.flow_type,
          bg.id AS budget_group_id,
          COALESCE(bg.name, sf.name, 'Not budgeted') AS budget_group_name,
          sf.id AS savings_fund_id,
          sf.name AS savings_fund_name,
          a.id AS account_id,
          a.name AS account_name,
          CASE
            WHEN c.flow_type IN ('INCOME', 'BORROWING', 'UNTRACKED_IN', 'TRANSFER_IN', 'SAVINGS_WITHDRAWAL')
              THEN t.amount
            ELSE -t.amount
          END AS cash_change,
          u.opening_cash_balance + SUM(
            CASE
              WHEN c.flow_type IN ('INCOME', 'BORROWING', 'UNTRACKED_IN', 'TRANSFER_IN', 'SAVINGS_WITHDRAWAL')
                THEN t.amount
              ELSE -t.amount
            END
          ) OVER (
            PARTITION BY t.user_id
            ORDER BY t.transaction_date ASC, t.entry_sequence ASC
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          ) AS running_cash_balance,
          CASE
            WHEN c.flow_type = 'SAVINGS_DEPOSIT' THEN t.amount
            WHEN c.flow_type = 'SAVINGS_WITHDRAWAL' THEN -t.amount
            ELSE 0.00
          END AS savings_change,
          u.opening_savings_balance + SUM(
            CASE
              WHEN c.flow_type = 'SAVINGS_DEPOSIT' THEN t.amount
              WHEN c.flow_type = 'SAVINGS_WITHDRAWAL' THEN -t.amount
              ELSE 0.00
            END
          ) OVER (
            PARTITION BY t.user_id
            ORDER BY t.transaction_date ASC, t.entry_sequence ASC
            ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
          ) AS running_savings_balance
        FROM transactions t
        JOIN users u ON u.id = t.user_id
        JOIN categories c ON c.id = t.category_id
        LEFT JOIN budget_groups bg ON bg.id = c.budget_group_id
        LEFT JOIN savings_funds sf ON sf.id = COALESCE(t.savings_fund_id, c.default_savings_fund_id)
        LEFT JOIN accounts a ON a.id = t.account_id;
      `);

      await tx.execute(sql`
        CREATE OR REPLACE VIEW v_account_balances AS
        SELECT
          a.id AS account_id,
          a.user_id,
          a.name AS account_name,
          a.type AS account_type,
          a.sort_order,
          a.opening_balance,
          COALESCE(tx_agg.money_in, 0.00) + COALESCE(tr_in.transfer_in, 0.00) AS money_in,
          COALESCE(tx_agg.money_out, 0.00) + COALESCE(tr_out.transfer_out, 0.00) AS money_out,
          a.opening_balance
            + COALESCE(tx_agg.money_in, 0.00) + COALESCE(tr_in.transfer_in, 0.00)
            - COALESCE(tx_agg.money_out, 0.00) - COALESCE(tr_out.transfer_out, 0.00) AS current_balance
        FROM accounts a
        LEFT JOIN (
          SELECT
            account_id,
            SUM(CASE WHEN cash_change > 0 AND flow_type <> 'SAVINGS_WITHDRAWAL' THEN cash_change ELSE 0.00 END) AS money_in,
            SUM(CASE WHEN cash_change < 0 AND flow_type <> 'SAVINGS_DEPOSIT' THEN -cash_change ELSE 0.00 END) AS money_out
          FROM v_transaction_ledger
          WHERE account_id IS NOT NULL
          GROUP BY account_id
        ) tx_agg ON tx_agg.account_id = a.id
        LEFT JOIN (
          SELECT to_account_id AS account_id, SUM(amount) AS transfer_in
          FROM account_transfers
          GROUP BY to_account_id
        ) tr_in ON tr_in.account_id = a.id
        LEFT JOIN (
          SELECT from_account_id AS account_id, SUM(amount + fee_amount) AS transfer_out
          FROM account_transfers
          GROUP BY from_account_id
        ) tr_out ON tr_out.account_id = a.id;
      `);

      await tx.execute(sql`
        CREATE OR REPLACE VIEW v_savings_fund_balances AS
        SELECT
          sf.id AS savings_fund_id,
          sf.user_id,
          sf.name AS savings_fund_name,
          sf.sort_order,
          sf.opening_balance,
          COALESCE(SUM(CASE WHEN l.flow_type = 'SAVINGS_DEPOSIT' THEN l.amount ELSE 0.00 END), 0.00) AS total_deposits,
          COALESCE(SUM(CASE WHEN l.flow_type = 'SAVINGS_WITHDRAWAL' THEN l.amount ELSE 0.00 END), 0.00) AS total_withdrawals,
          sf.opening_balance
            + COALESCE(SUM(CASE WHEN l.flow_type = 'SAVINGS_DEPOSIT' THEN l.amount ELSE 0.00 END), 0.00)
            - COALESCE(SUM(CASE WHEN l.flow_type = 'SAVINGS_WITHDRAWAL' THEN l.amount ELSE 0.00 END), 0.00) AS current_balance
        FROM savings_funds sf
        LEFT JOIN v_transaction_ledger l ON l.savings_fund_id = sf.id
        GROUP BY sf.id, sf.user_id, sf.name, sf.sort_order, sf.opening_balance;
      `);

      await tx.execute(sql`
        CREATE OR REPLACE VIEW v_monthly_budget_progress AS
        SELECT
          b.id,
          b.user_id,
          b.budget_month,
          b.item_type,
          COALESCE(c.name, bg.name, sf.name) AS target_name,
          b.planned_amount,
          COALESCE(actuals.actual_amount, 0.00) AS actual_amount,
          b.planned_amount - COALESCE(actuals.actual_amount, 0.00) AS remaining_amount,
          CASE
            WHEN b.planned_amount = 0 THEN NULL
            ELSE ROUND((COALESCE(actuals.actual_amount, 0.00) / b.planned_amount) * 100, 2)
          END AS used_percentage
        FROM monthly_budget_items b
        LEFT JOIN categories c ON c.id = b.category_id
        LEFT JOIN budget_groups bg ON bg.id = b.budget_group_id
        LEFT JOIN savings_funds sf ON sf.id = b.savings_fund_id
        LEFT JOIN LATERAL (
          SELECT SUM(l.amount) AS actual_amount
          FROM v_transaction_ledger l
          WHERE l.user_id = b.user_id
            AND DATE_TRUNC('month', l.transaction_date) = DATE_TRUNC('month', b.budget_month)
            AND (
              (b.item_type = 'INCOME' AND l.category_id = b.category_id AND l.flow_type = 'INCOME') OR
              (b.item_type = 'SPENDING' AND l.budget_group_id = b.budget_group_id AND l.flow_type = 'EXPENSE') OR
              (b.item_type = 'SAVINGS' AND l.savings_fund_id = b.savings_fund_id AND l.flow_type = 'SAVINGS_DEPOSIT')
            )
        ) actuals ON TRUE;
      `);

      console.log('Migration from Excel completed successfully!');
      console.log({
        users: 1,
        accounts: data.accounts.length,
        savingsFunds: data.savingsFunds.length,
        budgetGroups: uniqueBudgetGroups.length,
        categories: data.categories.length,
        transactions: data.transactions.length,
        transfers: data.transfers.length,
        monthlyBudgetItems: data.budgets.length,
      });
    });
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
