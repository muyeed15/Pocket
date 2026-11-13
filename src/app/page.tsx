import { Suspense } from 'react';
import { connection } from 'next/server';
import { getLedgerSnapshot } from '@/db/queries';
import { TABS } from '@/lib/constants';
import type { ActiveTab } from '@/types/ledger';
import { LedgerWorkspace } from '@/components/LedgerWorkspace';

type SearchParams = Promise<{ year?: string; month?: string; tab?: string }>;

async function LedgerContent({ searchParams }: { searchParams: SearchParams }) {
  const resolved = await searchParams;
  const parsedYear = resolved.year ? parseInt(resolved.year, 10) : NaN;
  const parsedMonth = resolved.month ? parseInt(resolved.month, 10) : NaN;

  const hasValidYear =
    Number.isFinite(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100;
  const hasValidMonth =
    Number.isFinite(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12;

  let validYear = parsedYear;
  let validMonth = parsedMonth;

  if (!hasValidYear || !hasValidMonth) {
    // Next.js Cache Components disallows reading current time during prerendering.
    await connection();
    const now = new Date();
    if (!hasValidYear) validYear = now.getFullYear();
    if (!hasValidMonth) validMonth = now.getMonth() + 1;
  }

  const initialTab = TABS.some((t) => t.id === resolved.tab)
    ? (resolved.tab as ActiveTab)
    : 'overview';

  const snapshot = await getLedgerSnapshot(validYear, validMonth);
  return <LedgerWorkspace data={snapshot} initialTab={initialTab} />;
}

export default function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-neutral-400">
          Pocket
        </div>
      }
    >
      <LedgerContent searchParams={searchParams} />
    </Suspense>
  );
}
