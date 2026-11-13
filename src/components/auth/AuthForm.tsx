'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import { loginAction, registerAction, type ActionResult } from '@/actions';
import { PageShell } from '@/components/layout/PageShell';
import { Button } from '@/components/ui/Button';
import { Field, fieldClass } from '@/components/ui/Field';

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const isRegister = mode === 'register';
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result: ActionResult | undefined = isRegister
        ? await registerAction(formData)
        : await loginAction(formData);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <PageShell
      centered
      eyebrow="Pocket"
      title={isRegister ? 'Create account' : 'Sign in'}
      description={
        isRegister
          ? 'Start a private ledger for your accounts and budget.'
          : 'Enter your email and password to open your ledger.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
          {isRegister && (
            <Field label="Name">
              <input
                type="text"
                name="name"
                required
                autoFocus
                autoComplete="name"
                placeholder="Your name"
                className={fieldClass}
              />
            </Field>
          )}

          <Field label="Email">
            <input
              type="email"
              name="email"
              required
              autoFocus={!isRegister}
              autoComplete="email"
              placeholder="you@example.com"
              className={fieldClass}
            />
          </Field>

          <Field
            label="Password"
            hint={isRegister ? 'At least 8 characters' : undefined}
          >
            <input
              type="password"
              name="password"
              required
              minLength={isRegister ? 8 : undefined}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              placeholder="••••••••"
              className={fieldClass}
            />
          </Field>

          {isRegister && (
            <Field label="Confirm password">
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
          )}

          {error && (
            <p
              role="alert"
              className="border-l-2 border-black pl-3 text-sm text-black"
            >
              {error}
            </p>
          )}

          <div className="pt-2">
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending
                ? isRegister
                  ? 'Creating account…'
                  : 'Signing in…'
                : isRegister
                  ? 'Create account'
                  : 'Sign in'}
            </Button>
          </div>
        </form>

        <footer className="border-t border-neutral-100 pt-6 text-sm text-neutral-500">
          {isRegister ? (
            <>
              Already have an account?{' '}
              <Link
                href="/login"
                className="text-black underline underline-offset-4 hover:text-neutral-600"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              New to Pocket?{' '}
              <Link
                href="/register"
                className="text-black underline underline-offset-4 hover:text-neutral-600"
              >
                Create an account
              </Link>
            </>
          )}
        </footer>
    </PageShell>
  );
}
