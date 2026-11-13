'use client';

import React from 'react';
import {
  IoAdd,
  IoChevronBack,
  IoChevronForward,
} from 'react-icons/io5';
import { MONTH_NAMES, TABS } from '@/lib/constants';
import { IconButton } from '@/components/ui/Button';
import type { ActiveTab } from '@/types/ledger';
import { StickyHeader } from './PageShell';
import { UserMenu } from './UserMenu';

interface TopHeaderProps {
  userName: string;
  userEmail: string;
  selectedYear: number;
  selectedMonth: number;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onSelectPeriod: (year: number, month: number) => void;
  addLabel?: string;
  onAdd: () => void;
  onLogout: () => void;
}

export function TopHeader({
  userName,
  userEmail,
  selectedYear,
  selectedMonth,
  activeTab,
  onSelectTab,
  onSelectPeriod,
  addLabel = 'New entry',
  onAdd,
  onLogout,
}: TopHeaderProps) {
  const shiftMonth = (delta: number) => {
    const index = selectedYear * 12 + (selectedMonth - 1) + delta;
    onSelectPeriod(Math.floor(index / 12), (index % 12) + 1);
  };

  return (
    <StickyHeader className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 sm:gap-x-8">
        <button
          type="button"
          onClick={() => onSelectTab('overview')}
          className="text-left text-xl tracking-tight text-black transition-opacity hover:opacity-75 sm:text-2xl"
        >
          Pocket
        </button>

        <nav className="order-3 -mx-1 flex w-full gap-5 overflow-x-auto px-1 [scrollbar-width:none] sm:gap-7 lg:order-2 lg:w-auto [&::-webkit-scrollbar]:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`whitespace-nowrap border-b-[1.5px] py-1 text-[15px] transition-colors sm:py-1.5 sm:text-[16px] ${
                activeTab === tab.id
                  ? 'border-black text-black'
                  : 'border-transparent text-neutral-400 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="order-2 ml-auto flex items-center gap-0.5 sm:gap-1 lg:order-3">
          <IconButton label="Previous month" onClick={() => shiftMonth(-1)}>
            <IoChevronBack />
          </IconButton>
          <span className="w-20 text-center text-[15px] tabular-nums sm:w-36 sm:text-[16px]">
            <span className="sm:hidden">
              {MONTH_NAMES[selectedMonth - 1].slice(0, 3)} {selectedYear}
            </span>
            <span className="hidden sm:inline">
              {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
          </span>
          <IconButton label="Next month" onClick={() => shiftMonth(1)}>
            <IoChevronForward />
          </IconButton>
          <IconButton label={addLabel} solid onClick={onAdd} className="ml-1 sm:ml-3">
            <IoAdd />
          </IconButton>
          <UserMenu
            userName={userName}
            userEmail={userEmail}
            onLogout={onLogout}
          />
        </div>
    </StickyHeader>
  );
}
