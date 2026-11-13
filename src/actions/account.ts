'use server';

import { and, eq, ne } from 'drizzle-orm';
import { db } from '@/db';
import { getUserById } from '@/db/queries/users';
import * as schema from '@/db/schema';
import { hashPassword, verifyPassword } from '@/lib/session';
import {
  ActionResult,
  invalidateLedgerCache,
  requireCurrentUserId,
} from './shared';

export async function updateProfileAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const name = String(formData.get('name') || '').trim();
  const email = String(formData.get('email') || '').trim().toLowerCase();

  if (!name) {
    return { error: 'Please enter your name.' };
  }
  if (!email || !email.includes('@')) {
    return { error: 'Please enter a valid email address.' };
  }

  const [conflict] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(and(eq(schema.users.email, email), ne(schema.users.id, userId)))
    .limit(1);

  if (conflict) {
    return { error: 'Another account is already using that email.' };
  }

  await db
    .update(schema.users)
    .set({
      name,
      email,
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId));

  invalidateLedgerCache(userId);
  return { ok: true };
}

export async function changePasswordAction(
  formData: FormData
): Promise<ActionResult> {
  const userId = await requireCurrentUserId();
  const currentPassword = String(formData.get('currentPassword') || '');
  const newPassword = String(formData.get('newPassword') || '');
  const confirmPassword = String(formData.get('confirmPassword') || '');

  if (!currentPassword) {
    return { error: 'Please enter your current password.' };
  }
  if (newPassword.length < 8) {
    return { error: 'New password must be at least 8 characters.' };
  }
  if (newPassword !== confirmPassword) {
    return { error: 'New passwords do not match.' };
  }

  const user = await getUserById(userId);
  if (!user || !user.passwordHash || !verifyPassword(currentPassword, user.passwordHash)) {
    return { error: 'Current password is incorrect.' };
  }

  await db
    .update(schema.users)
    .set({
      passwordHash: hashPassword(newPassword),
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, userId));

  return { ok: true };
}
