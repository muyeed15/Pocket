'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IoLogOutOutline,
  IoPersonOutline,
  IoSettingsOutline,
} from 'react-icons/io5';

interface UserMenuProps {
  userName: string;
  userEmail: string;
  onLogout: () => void;
}

export function UserMenu({ userName, userEmail, onLogout }: UserMenuProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(e: PointerEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const initial = userName.trim().charAt(0).toUpperCase();

  return (
    <div ref={containerRef} className="relative ml-2">
      <button
        type="button"
        aria-label="User menu"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((prev) => !prev)}
        className={`inline-flex size-9 shrink-0 items-center justify-center rounded-full border text-sm transition-colors ${
          open
            ? 'border-black bg-black text-white'
            : 'border-neutral-200 bg-white text-black hover:border-black'
        }`}
      >
        {initial || <IoPersonOutline className="text-base" />}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2.5 w-56 rounded-2xl border border-neutral-200 bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.08)]"
        >
          <div className="border-b border-neutral-100 px-3 py-2.5">
            <p className="truncate text-[15px] text-black">{userName}</p>
            <p className="truncate text-xs text-neutral-400">{userEmail}</p>
          </div>

          <div className="py-1">
            <Link
              href="/account"
              role="menuitem"
              aria-current={pathname === '/account' ? 'page' : undefined}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[15px] transition-colors hover:bg-neutral-100 hover:text-black ${
                pathname === '/account'
                  ? 'bg-neutral-100 text-black'
                  : 'text-neutral-600'
              }`}
            >
              <IoPersonOutline className="text-base" />
              Account
            </Link>
            <Link
              href="/settings"
              role="menuitem"
              aria-current={pathname === '/settings' ? 'page' : undefined}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-[15px] transition-colors hover:bg-neutral-100 hover:text-black ${
                pathname === '/settings'
                  ? 'bg-neutral-100 text-black'
                  : 'text-neutral-600'
              }`}
            >
              <IoSettingsOutline className="text-base" />
              Settings
            </Link>
          </div>

          <div className="border-t border-neutral-100 pt-1">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[15px] text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-black"
            >
              <IoLogOutOutline className="text-base" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
