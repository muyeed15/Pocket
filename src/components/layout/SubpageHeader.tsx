'use client';

import React, { useTransition } from 'react';
import Link from 'next/link';
import { IoArrowBack } from 'react-icons/io5';
import { logoutAction } from '@/actions';
import { StickyHeader } from './PageShell';
import { UserMenu } from './UserMenu';

interface SubpageHeaderProps {
  userName: string;
  userEmail: string;
}

export function SubpageHeader({ userName, userEmail }: SubpageHeaderProps) {
  const [, startTransition] = useTransition();

  return (
    <StickyHeader className="flex items-center justify-between">
      <div className="flex items-baseline gap-6 sm:gap-8">
        <Link href="/" className="text-xl tracking-tight text-black sm:text-2xl">
          Pocket
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-[15px] text-neutral-500 transition-colors hover:text-black"
        >
          <IoArrowBack className="text-sm" />
          Ledger
        </Link>
      </div>

      <UserMenu
        userName={userName}
        userEmail={userEmail}
        onLogout={() => startTransition(() => logoutAction())}
      />
    </StickyHeader>
  );
}
