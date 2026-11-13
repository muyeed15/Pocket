import { redirect } from 'next/navigation';
import { getUserById } from '@/db/queries/users';
import { getSessionUserId } from './session';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  currencyCode: string;
  currencySymbol: string;
  openingCashBalance: string;
  openingSavingsBalance: string;
}

export async function getOptionalUser(): Promise<AuthenticatedUser | null> {
  'use cache: private';

  const userId = await getSessionUserId();
  if (!userId) return null;

  const user = await getUserById(userId);
  if (!user) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    currencyCode: user.currencyCode,
    currencySymbol: user.currencySymbol,
    openingCashBalance: user.openingCashBalance,
    openingSavingsBalance: user.openingSavingsBalance,
  };
}

export async function getCurrentUser(): Promise<AuthenticatedUser> {
  'use cache: private';

  const user = await getOptionalUser();
  if (!user) {
    redirect('/login');
  }
  return user;
}
