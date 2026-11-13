'use server';

import { redirect } from 'next/navigation';
import { db } from '@/db';
import { getUserByEmail } from '@/db/queries/users';
import * as schema from '@/db/schema';
import {
  clearSessionCookie,
  createSessionCookie,
  hashPassword,
  verifyPassword,
} from '@/lib/session';
import type { ActionResult } from './shared';

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');

  if (!email || !password) {
    return { error: 'Please enter your email and password.' };
  }

  const user = await getUserByEmail(email);
  if (!user || !user.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return { error: 'Invalid email or password.' };
  }

  await createSessionCookie(user.id);
  redirect('/');
}

export async function registerAction(formData: FormData): Promise<ActionResult> {
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

  if (!name) {
    return { error: 'Please enter your name.' };
  }
  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' };
  }
  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters.' };
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match.' };
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return { error: 'An account with this email already exists.' };
  }

  const passwordHash = hashPassword(password);

  let createdUser: { id: string };
  try {
    createdUser = await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(schema.users)
        .values({
          name,
          email,
          passwordHash,
        })
        .returning({ id: schema.users.id });

      await tx.insert(schema.accounts).values({
        userId: user.id,
        name: 'Cash',
        type: 'CASH',
        openingBalance: '0.00',
        sortOrder: 0,
      });

      const [essentialsGroup, lifestyleGroup] = await tx
        .insert(schema.budgetGroups)
        .values([
          { userId: user.id, name: 'Essentials', sortOrder: 0 },
          { userId: user.id, name: 'Lifestyle', sortOrder: 1 },
        ])
        .returning({ id: schema.budgetGroups.id });

      const [emergencyFund] = await tx
        .insert(schema.savingsFunds)
        .values({
          userId: user.id,
          name: 'Emergency Fund',
          openingBalance: '0.00',
          sortOrder: 0,
        })
        .returning({ id: schema.savingsFunds.id });

      await tx.insert(schema.categories).values([
        {
          userId: user.id,
          name: 'Salary',
          flowType: 'INCOME',
        },
        {
          userId: user.id,
          name: 'Food and drinks',
          flowType: 'EXPENSE',
          budgetGroupId: essentialsGroup.id,
        },
        {
          userId: user.id,
          name: 'Transport',
          flowType: 'EXPENSE',
          budgetGroupId: essentialsGroup.id,
        },
        {
          userId: user.id,
          name: 'Rickshaw',
          flowType: 'EXPENSE',
          budgetGroupId: essentialsGroup.id,
        },
        {
          userId: user.id,
          name: 'Auto Rickshaw',
          flowType: 'EXPENSE',
          budgetGroupId: essentialsGroup.id,
        },
        {
          userId: user.id,
          name: 'CNG / Baby Taxi',
          flowType: 'EXPENSE',
          budgetGroupId: essentialsGroup.id,
        },
        {
          userId: user.id,
          name: 'Shopping',
          flowType: 'EXPENSE',
          budgetGroupId: lifestyleGroup.id,
        },
        {
          userId: user.id,
          name: 'Savings',
          flowType: 'SAVINGS_DEPOSIT',
          defaultSavingsFundId: emergencyFund.id,
        },
      ]);

      return user;
    });
  } catch {
    return { error: 'An account with this email already exists.' };
  }

  await createSessionCookie(createdUser.id);
  redirect('/');
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect('/login');
}
