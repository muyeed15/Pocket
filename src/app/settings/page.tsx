import { Suspense } from 'react';
import { getSettingsSnapshot } from '@/db/queries/settings';
import { SettingsView } from '@/components/settings/SettingsView';

async function SettingsContent() {
  const snapshot = await getSettingsSnapshot();
  return <SettingsView data={snapshot} />;
}

export default function SettingsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-neutral-400">
          Pocket
        </div>
      }
    >
      <SettingsContent />
    </Suspense>
  );
}
