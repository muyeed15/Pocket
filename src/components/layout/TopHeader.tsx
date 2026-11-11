'use client';

import React from 'react';
import { IoAdd, IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { MONTH_NAMES, TABS } from '@/lib/constants';
import { IconButton } from '@/components/ui/Button';
import type { ActiveTab } from '@/types/ledger';

interface TopHeaderProps {
  selectedYear: number;
  selectedMonth: number;
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onSelectPeriod: (year: number, month: number) => void;
  onAdd: () => void;
}

export function TopHeader({
  selectedYear,
  selectedMonth,
  activeTab,
  onSelectTab,
  onSelectPeriod,
  onAdd,
}: TopHeaderProps) {
  const shiftMonth = (delta: number) => {
    const index = selectedYear * 12 + (selectedMonth - 1) + delta;
    onSelectPeriod(Math.floor(index / 12), (index % 12) + 1);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-10 gap-y-3 px-6 py-4">
        <span className="text-2xl tracking-tight">Pocket</span>

        <nav className="order-3 -mx-1 flex w-full gap-7 overflow-x-auto px-1 md:order-2 md:w-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              aria-current={activeTab === tab.id ? 'page' : undefined}
              className={`whitespace-nowrap py-1 text-[16px] transition-colors ${
                activeTab === tab.id ? 'text-black' : 'text-neutral-400 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="order-2 ml-auto flex items-center gap-1 md:order-3">
          <IconButton label="Previous month" onClick={() => shiftMonth(-1)}>
            <IoChevronBack />
          </IconButton>
          <span className="w-36 text-center text-[16px] tabular-nums">
            {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </span>
          <IconButton label="Next month" onClick={() => shiftMonth(1)}>
            <IoChevronForward />
          </IconButton>
          <IconButton label="New entry" solid onClick={onAdd} className="ml-3">
            <IoAdd />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
