import { Suspense } from 'react';
import { SETTINGS_TABS } from '@/lib/constants';
import { getSettingsSnapshot } from '@/db/queries/settings';
import { SettingsView } from '@/components/settings/SettingsView';
import type { SettingsTab } from '@/types/ledger';

const VALID_SETTINGS_TABS = new Set<SettingsTab>(SETTINGS_TABS.map((t) => t.id));

async function SettingsContent({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  const [snapshot, params] = await Promise.all([
    getSettingsSnapshot(),
    searchParams,
  ]);
  const rawTab = Array.isArray(params.tab) ? params.tab[0] : params.tab;
  const initialTab = VALID_SETTINGS_TABS.has(rawTab as SettingsTab)
    ? (rawTab as SettingsTab)
    : 'preferences';

  return <SettingsView data={snapshot} initialTab={initialTab} />;
}

export default function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string | string[] }>;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-neutral-400">
          Pocket
        </div>
      }
    >
      <SettingsContent searchParams={searchParams} />
    </Suspense>
  );
}
