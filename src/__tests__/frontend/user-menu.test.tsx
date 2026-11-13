import { installDom } from './setup';
installDom();

import React from 'react';
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { UserMenu } from '@/components/layout/UserMenu';

afterEach(cleanup);

describe('UserMenu', () => {
  it('toggles dropdown with Account, Settings, and Log out options', () => {
    let loggedOut = false;
    render(
      <UserMenu
        userName="Syed Abdullah Al Muyeed"
        userEmail="muyeed.al.abdullah@gmail.com"
        onLogout={() => {
          loggedOut = true;
        }}
      />
    );

    const trigger = screen.getByRole('button', { name: 'User menu' });
    assert.equal(trigger.textContent, 'S');
    assert.equal(screen.queryByRole('menu'), null);

    fireEvent.click(trigger);
    assert.ok(screen.getByRole('menu'));

    const accountLink = screen.getByRole('menuitem', { name: 'Account' });
    const settingsLink = screen.getByRole('menuitem', { name: 'Settings' });
    assert.equal(accountLink.getAttribute('href'), '/account');
    assert.equal(settingsLink.getAttribute('href'), '/settings');

    fireEvent.click(screen.getByRole('menuitem', { name: 'Log out' }));
    assert.equal(loggedOut, true);
    assert.equal(screen.queryByRole('menu'), null);
  });

  it('closes menu on Escape key', () => {
    render(
      <UserMenu
        userName="Muyeed"
        userEmail="muyeed@pocket.local"
        onLogout={() => {}}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'User menu' }));
    assert.ok(screen.getByRole('menu'));

    fireEvent.keyDown(window, { key: 'Escape' });
    assert.equal(screen.queryByRole('menu'), null);
  });
});
