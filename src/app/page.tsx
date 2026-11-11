import { Suspense } from 'react';
import { getLedgerSnapshot } from '@/db/queries';
import { LedgerWorkspace } from '@/components/LedgerWorkspace';

type SearchParams = Promise<{ year?: string; month?: string }>;

async function LedgerContent({ searchParams }: { searchParams: SearchParams }) {
  const resolved = await searchParams;
  const year = resolved.year ? parseInt(resolved.year, 10) : 2026;
  const month = resolved.month ? parseInt(resolved.month, 10) : 11;

  const validYear = Number.isFinite(year) && year >= 2020 && year <= 2100 ? year : 2026;
  const validMonth =
    Number.isFinite(month) && month >= 1 && month <= 12 ? month : 11;

  const snapshot = await getLedgerSnapshot(validYear, validMonth);
  return <LedgerWorkspace data={snapshot} />;
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
