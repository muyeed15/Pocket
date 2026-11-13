'use client';

import React, { createContext, useContext } from 'react';

const CurrencyContext = createContext('Tk');

export function CurrencyProvider({
  symbol,
  children,
}: {
  symbol: string;
  children: React.ReactNode;
}) {
  return (
    <CurrencyContext.Provider value={symbol || 'Tk'}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrencySymbol(): string {
  return useContext(CurrencyContext);
}
