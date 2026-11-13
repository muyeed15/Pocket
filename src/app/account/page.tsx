import { Suspense } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { AccountView } from '@/components/account/AccountView';

async function AccountContent() {
  const user = await getCurrentUser();
  return <AccountView user={{ name: user.name, email: user.email }} />;
}

export default function AccountPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-neutral-400">
          Pocket
        </div>
      }
    >
      <AccountContent />
    </Suspense>
  );
}
