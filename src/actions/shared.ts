import { updateTag } from 'next/cache';
import { getDefaultUser } from '@/db/queries/users';

export type ActionResult = { ok?: boolean; error?: string };

export async function requireDefaultUserId(): Promise<string> {
  const user = await getDefaultUser();
  return user.id;
}

export function invalidateLedgerCache(): void {
  updateTag('ledger');
}
