'use client';

import React, { useRef } from 'react';
import { changePasswordAction, updateProfileAction } from '@/actions';
import { useActionToast } from '@/hooks/useActionToast';
import { PageShell } from '@/components/layout/PageShell';
import { SubpageHeader } from '@/components/layout/SubpageHeader';
import { Button } from '@/components/ui/Button';
import { Field, fieldClass } from '@/components/ui/Field';
import { Section } from '@/components/ui/Section';

interface AccountViewProps {
  user: {
    name: string;
    email: string;
  };
}

export function AccountView({ user }: AccountViewProps) {
  const { isPending, toast, dismissToast, runAction } = useActionToast();
  const passwordFormRef = useRef<HTMLFormElement>(null);

  return (
    <PageShell
      header={<SubpageHeader userName={user.name} userEmail={user.email} />}
      title="Account"
      description="Manage your name, email address, and password."
      toast={toast}
      onDismissToast={dismissToast}
    >
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
            <Section title="Profile">
              <form
                key={`${user.name}-${user.email}`}
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  runAction(() => updateProfileAction(fd), 'Profile updated');
                }}
                className="space-y-7"
              >
                <Field label="Name">
                  <input
                    type="text"
                    name="name"
                    required
                    defaultValue={user.name}
                    autoComplete="name"
                    className={fieldClass}
                  />
                </Field>

                <Field label="Email">
                  <input
                    type="email"
                    name="email"
                    required
                    defaultValue={user.email}
                    autoComplete="email"
                    className={fieldClass}
                  />
                </Field>

                <div className="pt-2">
                  <Button type="submit" disabled={isPending}>
                    Save profile
                  </Button>
                </div>
              </form>
            </Section>

            <Section title="Password">
              <form
                ref={passwordFormRef}
                onSubmit={(e) => {
                  e.preventDefault();
                  const fd = new FormData(e.currentTarget);
                  runAction(
                    () => changePasswordAction(fd),
                    'Password updated',
                    () => passwordFormRef.current?.reset()
                  );
                }}
                className="space-y-7"
              >
                <Field label="Current password">
                  <input
                    type="password"
                    name="currentPassword"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className={fieldClass}
                  />
                </Field>

                <Field label="New password" hint="At least 8 characters">
                  <input
                    type="password"
                    name="newPassword"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={fieldClass}
                  />
                </Field>

                <Field label="Confirm new password">
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className={fieldClass}
                  />
                </Field>

                <div className="pt-2">
                  <Button type="submit" disabled={isPending}>
                    Update password
                  </Button>
                </div>
              </form>
            </Section>
      </div>
    </PageShell>
  );
}
