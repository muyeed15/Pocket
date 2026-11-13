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
      toast={toast}
      onDismissToast={dismissToast}
    >
      <div className="space-y-10 sm:space-y-12">
        <Section title="Profile">
          <form
            key={`${user.name}-${user.email}`}
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              runAction(() => updateProfileAction(fd), 'Profile updated');
            }}
          >
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
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
            </div>

            <div className="mt-6 flex justify-end border-t border-neutral-200 pt-5 sm:mt-7">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full shrink-0 sm:w-auto"
              >
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
          >
            <input
              type="text"
              name="username"
              value={user.email}
              readOnly
              autoComplete="username"
              tabIndex={-1}
              aria-hidden="true"
              className="hidden"
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
            </div>

            <div className="mt-6 flex justify-end border-t border-neutral-200 pt-5 sm:mt-7">
              <Button
                type="submit"
                disabled={isPending}
                className="w-full shrink-0 sm:w-auto"
              >
                Update password
              </Button>
            </div>
          </form>
        </Section>
      </div>
    </PageShell>
  );
}
