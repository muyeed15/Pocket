const numberFormatter = new Intl.NumberFormat('en-BD', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const dayLabelFormatter = new Intl.DateTimeFormat('en-GB', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});

export function formatTk(
  value: number | string | null | undefined,
  options?: { showSign?: boolean; symbol?: string }
): string {
  const num = typeof value === 'string' ? parseFloat(value) : (value ?? 0);
  const safeNum = Number.isFinite(num) ? num : 0;
  const symbol = options?.symbol ?? 'Tk';
  const absFormatted = numberFormatter.format(Math.abs(safeNum));

  if (safeNum < 0) return `-${symbol} ${absFormatted}`;
  if (options?.showSign && safeNum > 0) return `+${symbol} ${absFormatted}`;
  return `${symbol} ${absFormatted}`;
}

export function toNum(value: string | number | null | undefined): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (!value) return 0;
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function getMonthPrefix(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** "2026-11-11" -> "Wednesday 11 November" */
export function formatDayLabel(isoDate: string): string {
  return dayLabelFormatter
    .format(new Date(`${isoDate}T00:00:00Z`))
    .replace(',', '');
}

/** Today's date in the user's local timezone as YYYY-MM-DD. */
export function todayLocalIso(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);
}

export function ratio(value: number, target: number): number {
  if (target > 0) return Math.min(Math.max(value / target, 0), 1);
  return value > 0 ? 1 : 0;
}
