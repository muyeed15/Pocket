import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getOptionalUser } from '@/lib/auth';
import { AuthForm } from '@/components/auth/AuthForm';

async function LoginContent() {
  const user = await getOptionalUser();
  if (user) {
    redirect('/');
  }
  return <AuthForm mode="login" />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-neutral-400">
          Pocket
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
