import { installDom } from './setup';
installDom();

import React from 'react';
import { afterEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ActivityRings } from '@/components/ui/ActivityRings';
import { BalanceHero } from '@/components/dashboard/BalanceHero';
import { MonthRings } from '@/components/dashboard/MonthRings';
import { BarChart } from '@/components/ui/BarChart';
import { Combobox } from '@/components/ui/Combobox';
import { ConfirmDeleteButton } from '@/components/ui/ConfirmDeleteButton';
import { CurrencyProvider } from '@/components/ui/CurrencyContext';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { SearchField } from '@/components/ui/Field';
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

  it('shows Total balance without redundant bottom summary and anchors sparkline at Start of month balance', () => {
    render(
      <CurrencyProvider symbol="$">
        <BalanceHero
          cashBalance={1500}
          cashChange={-500}
          dailyBalance={[2000, 1500]}
          monthName="November"
        />
      </CurrencyProvider>
    );

    assert.ok(screen.getByText('Total balance'));
    assert.ok(screen.getByText('$ 1,500.00'));
    assert.equal(screen.queryByText('Cash on hand'), null);
    assert.equal(screen.queryByText(/Down .* in November/), null);
    assert.equal(screen.queryByText(/Earned /), null);
    assert.equal(screen.queryByText(/Spent /), null);

    const chart = screen.getByRole('img', { name: 'Daily cash balance trend' });
    fireEvent.keyDown(chart, { key: 'ArrowRight' });
    const tooltip = screen.getByRole('tooltip');
    assert.ok(tooltip.textContent?.includes('Start of November'));
    assert.ok(tooltip.textContent?.includes('$ 2,000.00'));
  });

  it('restores fallback option label on Combobox clear and renders clear button in SearchField', () => {
    let filterVal = 'EXPENSE';
    const { rerender } = render(
      <Combobox
        ariaLabel="Type"
        options={[
          { value: 'ALL', label: 'All types' },
          { value: 'EXPENSE', label: 'Expense' },
        ]}
        value={filterVal}
        allowClear
        onChange={(next) => {
          filterVal = next || 'ALL';
        }}
      />
    );
    const combo = screen.getByRole('combobox', { name: 'Type' }) as HTMLInputElement;
    assert.equal(combo.value, 'Expense');

    fireEvent.mouseDown(screen.getByRole('button', { name: 'Clear selection' }));
    assert.equal(filterVal, 'ALL');
    rerender(
      <Combobox
        ariaLabel="Type"
        options={[
          { value: 'ALL', label: 'All types' },
          { value: 'EXPENSE', label: 'Expense' },
        ]}
        value={filterVal}
        allowClear
        onChange={() => {}}
      />
    );
    assert.equal(combo.value, 'All types');

    let q = 'coffee';
    render(<SearchField value={q} onChange={(next) => (q = next)} label="Find" />);
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    assert.equal(q, '');
  });

  it('keeps Sheet and focused inputs above mobile soft keyboards and flips Combobox upward when constrained', async () => {
    const prevHeight = window.innerHeight;
    const prevVv = window.visualViewport;
    const vvListeners = new Map<string, Set<EventListener>>();
    let vvHeight = 800;

    const fakeVv = {
      get height() {
        return vvHeight;
      },
      offsetTop: 0,
      addEventListener(type: string, cb: EventListener) {
        if (!vvListeners.has(type)) vvListeners.set(type, new Set());
        vvListeners.get(type)!.add(cb);
      },
      removeEventListener(type: string, cb: EventListener) {
        vvListeners.get(type)?.delete(cb);
      },
    };

    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 800 });
    Object.defineProperty(window, 'visualViewport', { configurable: true, value: fakeVv });

    try {
      let scrolledCount = 0;
      render(
        <Sheet title="Mobile test" open={true} onClose={() => {}}>
          <Combobox
            ariaLabel="Account"
            options={[
              { value: 'cash', label: 'Cash' },
              { value: 'bkash', label: 'bKash' },
            ]}
            value=""
            onChange={() => {}}
          />
          <input aria-label="Note" type="text" />
        </Sheet>
      );

      const noteInput = screen.getByLabelText('Note') as HTMLInputElement;
      noteInput.getBoundingClientRect = () =>
        ({ top: 520, bottom: 560, left: 0, right: 300, width: 300, height: 40, x: 0, y: 520, toJSON() {} }) as DOMRect;
      noteInput.scrollIntoView = () => {
        scrolledCount += 1;
      };

      // Simulate Android overlay keyboard opening (360px keyboard height)
      vvHeight = 440;
      act(() => {
        vvListeners.get('resize')?.forEach((fn) => fn(new Event('resize')));
      });

      const dialog = screen.getByRole('dialog', { name: 'Mobile test' });
      const backdrop = dialog.parentElement as HTMLElement;
      assert.equal(backdrop.style.paddingBottom, '360px');
      assert.equal(dialog.style.maxHeight, '424px');

      // Focusing a field obscured behind the keyboard scrolls it into view
      fireEvent.focusIn(noteInput);
      noteInput.focus();
      await act(async () => {
        await new Promise((r) => setTimeout(r, 40));
      });
      assert.ok(scrolledCount >= 1);

      // Opening Combobox near the bottom above the keyboard flips listbox upward
      const combo = screen.getByRole('combobox', { name: 'Account' });
      const wrapper = combo.parentElement!.parentElement!;
      wrapper.getBoundingClientRect = () =>
        ({ top: 340, bottom: 380, left: 0, right: 300, width: 300, height: 40, x: 0, y: 340, toJSON() {} }) as DOMRect;
      fireEvent.focus(combo);
      await act(async () => {
        await new Promise((r) => setTimeout(r, 40));
      });

      const listbox = screen.getByRole('listbox');
      assert.ok(listbox.className.includes('bottom-full'));
    } finally {
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: prevHeight });
      Object.defineProperty(window, 'visualViewport', { configurable: true, value: prevVv });
    }
  });

  it('shows only percentages in MonthRings legend and opens tooltips on mobile tap for rings, legend, BarChart, and Sparkline', () => {
    const { container } = render(
      <CurrencyProvider symbol="$">
        <div>
          <MonthRings
            summary={{
              monthIndex: 11,
              monthName: 'November',
              income: 800,
              spending: 750,
              saved: 200,
              savingsUsed: 0,
              borrowed: 0,
              debtPaid: 0,
              transfersNet: 0,
              transferFees: 0,
              untrackedNet: 0,
              plannedIncome: 1000,
              plannedSpending: 1000,
              plannedSavings: 0,
              cashChange: 50,
              cashBalance: 1500,
              savingsBalance: 200,
              totalBalance: 1700,
            }}
          />
          <BarChart
            series={[{ label: 'Spent', values: [120, 450], tone: TONES.primary }]}
            labels={['1', '2']}
            formatLabel={(day) => `${day} November`}
          />
          <Sparkline
            values={[1000, 1250, 900]}
            labels={['1 November', '2 November', '3 November']}
          />
        </div>
      </CurrencyProvider>
    );

    // MonthRings legend keeps only labels and percentages (omits "X of Y" / dollar lines)
    assert.ok(screen.getByText('75%'));
    assert.ok(screen.getByText('No goal'));
    assert.ok(screen.getByText('80%'));
    assert.equal(screen.queryByText(/of \$ /), null);
    assert.equal(screen.queryByText(/\$ 750\.00/), null);

    // Simulate mobile touch sequence on ActivityRings SVG group: pointerdown(touch) -> mouseenter -> focus -> click
    const svg = screen.getByRole('img', { name: 'Spent, Saved, Earned' });
    const firstRingGroup = svg.querySelector('g')!;
    fireEvent(
      firstRingGroup,
      Object.assign(new Event('pointerdown', { bubbles: true }), { pointerType: 'touch' })
    );
    fireEvent.mouseEnter(firstRingGroup);
    fireEvent.focus(firstRingGroup);
    fireEvent.click(firstRingGroup);

    const ringTooltip = screen.getByRole('tooltip');
    assert.ok(ringTooltip.textContent?.includes('Spent'));
    assert.ok(ringTooltip.textContent?.includes('$ 750.00 / $ 1,000.00'));

    // Tapping a legend row switches tooltip to that ring (showing amounts even with "No goal")
    const savedButton = screen.getByRole('button', { name: /Saved/ });
    fireEvent(
      savedButton,
      Object.assign(new Event('pointerdown', { bubbles: true }), { pointerType: 'touch' })
    );
    fireEvent.mouseEnter(savedButton);
    fireEvent.focus(savedButton);
    fireEvent.click(savedButton);
    const savedTooltip = screen.getByRole('tooltip');
    assert.ok(savedTooltip.textContent?.includes('Saved'));
    assert.ok(savedTooltip.textContent?.includes('$ 200.00'));

    // Tapping the same legend row again dismisses tooltip
    fireEvent.click(savedButton);
    assert.equal(screen.queryByRole('tooltip'), null);

    // BarChart mobile tap (even with mouseEnter + focus before click) opens & keeps tooltip
    const secondBar = screen.getByTitle('Spent, 2: $ 450.00').parentElement!;
    fireEvent(
      secondBar,
      Object.assign(new Event('pointerdown', { bubbles: true }), { pointerType: 'touch' })
    );
    fireEvent.mouseEnter(secondBar);
    fireEvent.focus(secondBar);
    fireEvent.click(secondBar);
    const barTooltip = screen.getByRole('tooltip');
    assert.ok(barTooltip.textContent?.includes('2 November'));
    assert.ok(barTooltip.textContent?.includes('$ 450.00'));

    // Sparkline tap/click opens & keeps tooltip at clicked position and dismisses on outside tap
    const sparkChart = screen.getByRole('img', { name: 'Daily cash balance trend' });
    sparkChart.getBoundingClientRect = () =>
      ({ left: 0, right: 200, top: 0, bottom: 80, width: 200, height: 80, x: 0, y: 0, toJSON() {} }) as DOMRect;
    fireEvent(
      sparkChart,
      Object.assign(new Event('pointerdown', { bubbles: true }), { pointerType: 'touch' })
    );
    fireEvent.click(sparkChart, { clientX: 100 });
    const sparkTooltip = screen.getByRole('tooltip');
    assert.ok(sparkTooltip.textContent?.includes('2 November'));
    assert.ok(sparkTooltip.textContent?.includes('$ 1,250.00'));

    // Tapping outside dismisses active chart tooltip
    fireEvent(
      container,
      Object.assign(new Event('pointerdown', { bubbles: true }), { pointerType: 'touch' })
    );
    assert.equal(screen.queryByRole('tooltip'), null);
  });
});
