import { installDom } from './setup';
installDom();

import React from 'react';
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ActivityRings } from '@/components/ui/ActivityRings';
import { BalanceHero } from '@/components/dashboard/BalanceHero';
import { BarChart } from '@/components/ui/BarChart';
import { Combobox } from '@/components/ui/Combobox';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDeleteButton';
import { CurrencyProvider } from '@/components/ui/CurrencyContext';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Sheet } from '@/components/ui/Sheet';
import { Sparkline } from '@/components/ui/Sparkline';
import { Toast } from '@/components/ui/Toast';
import { TONES } from '@/lib/constants';

afterEach(cleanup);

describe('UI primitives', () => {
  it('renders ActivityRings with accessible label', () => {
    render(
      <ActivityRings
        rings={[
          { label: 'Spent', value: 50, target: 100, tone: TONES.primary },
          { label: 'Saved', value: 25, target: 100, tone: TONES.secondary },
        ]}
      />
    );

    const img = screen.getByRole('img', { name: 'Spent, Saved' });
    assert.ok(img);
    assert.equal(img.querySelectorAll('circle').length, 4);
  });

  it('renders BarChart and handles bar selection', () => {
    let selected = -1;
    render(
      <BarChart
        series={[{ label: 'Spent', values: [100, 200, 50], tone: TONES.primary }]}
        labels={['Jan', 'Feb', 'Mar']}
        activeIndex={1}
        onSelect={(idx) => {
          selected = idx;
        }}
      />
    );

    const febBar = screen.getByTitle('Spent, Feb: Tk 200.00');
    fireEvent.click(febBar.parentElement!);
    assert.equal(selected, 1);

    const janContainer = screen.getByTitle('Spent, Jan: Tk 100.00').parentElement!;
    assert.ok(janContainer.className.includes('opacity-30'));
  });

  it('renders Sparkline only when given 2 or more points', () => {
    const { container, rerender } = render(<Sparkline values={[100]} />);
    assert.equal(container.querySelector('svg'), null);

    rerender(<Sparkline values={[100, 150, 120]} />);
    assert.ok(container.querySelector('svg polyline'));
  });

  it('clamps ProgressBar width between 0% and 100%', () => {
    const { container } = render(<ProgressBar value={150} target={100} />);
    const fill = container.firstElementChild?.firstElementChild as HTMLElement;
    assert.equal(fill.style.width, '100%');
  });

  it('opens Sheet and closes on Escape and close button', () => {
    let closedCount = 0;
    const { rerender } = render(
      <Sheet title="Test sheet" open={false} onClose={() => closedCount++}>
        <p>Inside</p>
      </Sheet>
    );
    assert.equal(screen.queryByRole('dialog'), null);

    rerender(
      <Sheet title="Test sheet" open={true} onClose={() => closedCount++}>
        <p>Inside</p>
      </Sheet>
    );
    assert.ok(screen.getByRole('dialog', { name: 'Test sheet' }));

    fireEvent.keyDown(window, { key: 'Escape' });
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    assert.equal(closedCount, 2);
  });

  it('renders Toast and dismisses on button click', () => {
    let dismissed = false;
    render(
      <Toast
        message={{ type: 'error', text: 'Something failed' }}
        onDismiss={() => {
          dismissed = true;
        }}
      />
    );

    assert.equal(screen.getByRole('status').textContent, 'Something failed');
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss' }));
    assert.equal(dismissed, true);
  });

  it('closes Combobox on Escape without closing parent Sheet until pressed again', () => {
    let closedCount = 0;
    render(
      <Sheet title="Entry" open={true} onClose={() => closedCount++}>
        <Combobox
          ariaLabel="Category"
          options={[
            { value: 'a', label: 'Food' },
            { value: 'b', label: 'Rent' },
          ]}
          value="a"
          onChange={() => {}}
        />
      </Sheet>
    );

    const input = screen.getByRole('combobox', { name: 'Category' }) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'Re' } });
    assert.ok(screen.getByRole('listbox'));

    // First Escape closes Combobox and resets uncommitted query, keeping Sheet open
    fireEvent.keyDown(input, { key: 'Escape' });
    assert.equal(screen.queryByRole('listbox'), null);
    assert.equal(input.value, 'Food');
    assert.equal(closedCount, 0);

    // ArrowDown reopens a focused Combobox after Escape
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    assert.ok(screen.getByRole('listbox'));
    fireEvent.keyDown(input, { key: 'Escape' });
    assert.equal(screen.queryByRole('listbox'), null);
    assert.equal(closedCount, 0);

    // Clicking an already-focused closed Combobox reopens it
    fireEvent.click(input);
    assert.ok(screen.getByRole('listbox'));
    fireEvent.keyDown(input, { key: 'Escape' });
    assert.equal(screen.queryByRole('listbox'), null);
    assert.equal(closedCount, 0);

    // Second Escape when Combobox is already closed bubbles up to close Sheet
    fireEvent.keyDown(input, { key: 'Escape' });
    assert.equal(closedCount, 1);
  });

  it('resets Combobox query on Tab/blur and supports allowClear', () => {
    let current = 'a';
    const { rerender } = render(
      <Combobox
        ariaLabel="Optional field"
        options={[
          { value: 'a', label: 'Cash' },
          { value: 'b', label: 'Bank' },
        ]}
        value={current}
        onChange={(next) => {
          current = next;
        }}
      />
    );

    const input = screen.getByRole('combobox', { name: 'Optional field' }) as HTMLInputElement;
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: 'Tab' });
    assert.equal(screen.queryByRole('listbox'), null);

    // Blur resets typed mismatch
    fireEvent.focus(input);
    fireEvent.change(input, { target: { value: 'typo' } });
    assert.equal(current, '');
    fireEvent.blur(input, { relatedTarget: null });
    assert.equal(screen.queryByRole('listbox'), null);

    // Clear button when selected and not required
    rerender(
      <Combobox
        ariaLabel="Optional field"
        options={[
          { value: 'a', label: 'Cash' },
          { value: 'b', label: 'Bank' },
        ]}
        value="b"
        onChange={(next) => {
          current = next;
        }}
      />
    );
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Clear selection' }));
    assert.equal(current, '');

    // Required Combobox hides clear button
    rerender(
      <Combobox
        ariaLabel="Required field"
        required
        options={[{ value: 'b', label: 'Bank' }]}
        value="b"
        onChange={() => {}}
      />
    );
    assert.equal(screen.queryByRole('button', { name: 'Clear selection' }), null);
  });

  it('uses CurrencyProvider symbol in BarChart tooltips', () => {
    render(
      <CurrencyProvider symbol="$">
        <BarChart
          series={[{ label: 'Spent', values: [100, 200], tone: TONES.primary }]}
          labels={['Jan', 'Feb']}
        />
      </CurrencyProvider>
    );

    assert.ok(screen.getByTitle('Spent, Feb: $ 200.00'));
  });

  it('shows interactive tooltip on BarChart bar hover and clears on mouseLeave', () => {
    const { container } = render(
      <CurrencyProvider symbol="$">
        <BarChart
          series={[{ label: 'Spent', values: [120, 450], tone: TONES.primary }]}
          labels={['1', '2']}
          formatLabel={(day) => `${day} November`}
        />
      </CurrencyProvider>
    );

    assert.equal(screen.queryByRole('tooltip'), null);
    const secondBar = screen.getByTitle('Spent, 2: $ 450.00').parentElement!;
    fireEvent.mouseEnter(secondBar);

    const tooltip = screen.getByRole('tooltip');
    assert.ok(tooltip.textContent?.includes('2 November'));
    assert.ok(tooltip.textContent?.includes('$ 450.00'));

    fireEvent.mouseLeave(container.firstElementChild!);
    assert.equal(screen.queryByRole('tooltip'), null);
  });

  it('shows interactive tooltip when scrubbing Sparkline via keyboard arrows', () => {
    render(
      <CurrencyProvider symbol="$">
        <Sparkline
          values={[1000, 1250, 900]}
          labels={['1 November', '2 November', '3 November']}
        />
      </CurrencyProvider>
    );

    const chart = screen.getByRole('img', { name: 'Daily cash balance trend' });
    assert.equal(screen.queryByRole('tooltip'), null);

    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    assert.ok(screen.getByRole('tooltip').textContent?.includes('1 November'));
    assert.ok(screen.getByRole('tooltip').textContent?.includes('$ 1,000.00'));

    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    assert.ok(screen.getByRole('tooltip').textContent?.includes('2 November'));
    assert.ok(screen.getByRole('tooltip').textContent?.includes('$ 1,250.00'));

    fireEvent.keyDown(chart, { key: 'Escape' });
    assert.equal(screen.queryByRole('tooltip'), null);
  });

  it('shows interactive tooltip and percentage when hovering an ActivityRings ring', () => {
    render(
      <CurrencyProvider symbol="$">
        <ActivityRings
          rings={[
            { label: 'Spent', value: 75, target: 100, tone: TONES.primary },
            { label: 'Saved', value: 25, target: 50, tone: TONES.secondary },
          ]}
        />
      </CurrencyProvider>
    );

    const svg = screen.getByRole('img', { name: 'Spent, Saved' });
    const firstRingGroup = svg.querySelector('g')!;
    fireEvent.mouseEnter(firstRingGroup);

    const tooltip = screen.getByRole('tooltip');
    assert.ok(tooltip.textContent?.includes('Spent'));
    assert.ok(tooltip.textContent?.includes('$ 75.00 / $ 100.00'));
    assert.ok(screen.getByText('75%'));

    fireEvent.mouseLeave(svg.parentElement!);
    assert.equal(screen.queryByRole('tooltip'), null);
  });

  it('requires two-step confirmation in ConfirmDeleteButton and resets on Escape', () => {
    let confirmed = false;
    render(
      <ConfirmDeleteButton
        label="Delete entry"
        onConfirm={() => {
          confirmed = true;
        }}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Delete entry' }));
    assert.equal(confirmed, false);
    const confirmBtn = screen.getByRole('button', { name: 'Confirm delete' });

    fireEvent.keyDown(confirmBtn, { key: 'Escape' });
    assert.ok(screen.getByRole('button', { name: 'Delete entry' }));

    fireEvent.click(screen.getByRole('button', { name: 'Delete entry' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm delete' }));
    assert.equal(confirmed, true);
  });

  it('renders compact empty baseline in BarChart when all values are zero', () => {
    render(
      <BarChart
        series={[{ label: 'Spent', values: [0, 0, 0], tone: TONES.primary }]}
        labels={['Jan', 'Feb', 'Mar']}
        emptyMessage="No entries in 2026"
      />
    );

    assert.ok(screen.getByText('No entries in 2026'));
  });

  it('anchors BalanceHero sparkline at Start of month balance', () => {
    render(
      <CurrencyProvider symbol="$">
        <BalanceHero
          cashBalance={1500}
          cashChange={500}
          earned={1000}
          spent={500}
          dailyBalance={[2000, 1500]}
          monthName="November"
        />
      </CurrencyProvider>
    );

    const chart = screen.getByRole('img', { name: 'Daily cash balance trend' });
    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    const tooltip = screen.getByRole('tooltip');
    assert.ok(tooltip.textContent?.includes('Start of November'));
    assert.ok(tooltip.textContent?.includes('$ 1,000.00'));
  });
});
