import { eq } from 'drizzle-orm';
import { db } from '../index';
import * as schema from '../schema';

export async function getUserById(userId: string) {
  const [userRow] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);
  return userRow ?? null;
}

export async function getUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const [userRow] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, normalized))
    .limit(1);
  return userRow ?? null;
}
