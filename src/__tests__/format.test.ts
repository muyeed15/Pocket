import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatDayLabel,
  formatTk,
  getMonthPrefix,
  ratio,
  round2,
  toNum,
} from '@/lib/format';

describe('format utilities', () => {
  it('formats currency values with sign and symbol options', () => {
    assert.equal(formatTk(1250.5), 'Tk 1,250.50');
    assert.equal(formatTk(-500), '-Tk 500.00');
    assert.equal(formatTk(500, { showSign: true }), '+Tk 500.00');
    assert.equal(formatTk(0, { showSign: true }), 'Tk 0.00');
    assert.equal(formatTk('42.1', { symbol: '$' }), '$ 42.10');
    assert.equal(formatTk(null), 'Tk 0.00');
  });

  it('parses numbers safely and rounds to 2 decimals', () => {
    assert.equal(toNum('123.45'), 123.45);
    assert.equal(toNum(null), 0);
    assert.equal(toNum('not-a-number'), 0);
    assert.equal(round2(10.125), 10.13);
    assert.equal(round2(0.1 + 0.2), 0.3);
  });

  it('formats month prefixes and day labels', () => {
    assert.equal(getMonthPrefix(2026, 3), '2026-03');
    assert.equal(getMonthPrefix(2026, 11), '2026-11');
    assert.equal(formatDayLabel('2026-11-11'), 'Wednesday 11 November');
  });

  it('clamps ratios between 0 and 1', () => {
    assert.equal(ratio(50, 100), 0.5);
    assert.equal(ratio(150, 100), 1);
    assert.equal(ratio(-10, 100), 0);
    assert.equal(ratio(10, 0), 1);
    assert.equal(ratio(0, 0), 0);
  });
});
