import { db } from '../index';
import * as schema from '../schema';

export async function getDefaultUser() {
  const [userRow] = await db.select().from(schema.users).limit(1);
  if (!userRow) {
    throw new Error('No user found in database. Run `npm run db:seed` first.');
  }
  return userRow;
}
