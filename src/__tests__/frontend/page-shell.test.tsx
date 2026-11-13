import { installDom } from './setup';
installDom();

import React from 'react';
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { AccountView } from '@/components/account/AccountView';
import { AuthForm } from '@/components/auth/AuthForm';
import { PageShell, StickyHeader } from '@/components/layout/PageShell';

afterEach(cleanup);

describe('PageShell and unified page layouts', () => {
  it('renders header slot, title, description, content, and dismissible toast', () => {
    let dismissed = false;
    render(
      <PageShell
        header={<StickyHeader className="flex items-center">Top nav</StickyHeader>}
        title="Settings"
        description="Configure ledger defaults."
        toast={{ text: 'Saved', type: 'success' }}
        onDismissToast={() => {
          dismissed = true;
        }}
      >
        <p>Main content</p>
      </PageShell>
    );

    assert.ok(screen.getByText('Top nav'));
    assert.equal(screen.getByRole('heading', { level: 1 }).textContent, 'Settings');
    assert.ok(screen.getByText('Configure ledger defaults.'));
    assert.ok(screen.getByText('Main content'));
    assert.ok(screen.getByText('Saved'));

    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    assert.equal(dismissed, true);
  });

  it('renders centered mode with eyebrow, heading, and description', () => {
    render(
      <PageShell
        centered
        eyebrow="Pocket"
        title="Sign in"
        description="Enter your email and password to open your ledger."
      >
        <form aria-label="Login form" />
      </PageShell>
    );

    assert.ok(screen.getByText('Pocket'));
    assert.equal(screen.getByRole('heading', { level: 1 }).textContent, 'Sign in');
    assert.ok(screen.getByText('Enter your email and password to open your ledger.'));
    assert.ok(screen.getByRole('form', { name: 'Login form' }));
  });

  it('renders AccountView using SubpageHeader and PageShell', () => {
    render(<AccountView user={{ name: 'Muyeed', email: 'muyeed@example.com' }} />);

    assert.equal(screen.getByRole('heading', { level: 1 }).textContent, 'Account');
    assert.ok(screen.getByText('Manage your name, email address, and password.'));
    assert.ok(screen.getByRole('link', { name: /Overview/i }));
    assert.ok(screen.getByRole('button', { name: 'User menu' }));
    assert.ok(screen.getByLabelText('Name'));
    assert.ok(screen.getByLabelText('Email'));
    assert.ok(screen.getByLabelText('Current password'));
  });

  it('renders AuthForm login and register modes via PageShell', () => {
    const { rerender } = render(<AuthForm mode="login" />);
    assert.ok(screen.getByText('Pocket'));
    assert.equal(screen.getByRole('heading', { level: 1 }).textContent, 'Sign in');
    assert.equal(screen.getByRole('link', { name: 'Create an account' }).getAttribute('href'), '/register');

    rerender(<AuthForm mode="register" />);
    assert.equal(screen.getByRole('heading', { level: 1 }).textContent, 'Create account');
    assert.ok(screen.getByLabelText('Name'));
    assert.equal(screen.getByRole('link', { name: 'Sign in' }).getAttribute('href'), '/login');
  });
});
