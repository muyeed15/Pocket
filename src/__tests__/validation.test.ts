import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isIsoDate,
  isUuid,
  parseBudgetItemInput,
  parseTransactionInput,
  parseTransferInput,
} from '@/lib/validation';

const UUID_1 = '11111111-1111-4111-8111-111111111111';
const UUID_2 = '22222222-2222-4222-8222-222222222222';
const UUID_3 = '33333333-3333-4333-8333-333333333333';

describe('validation helpers', () => {
  it('validates UUIDs strictly', () => {
    assert.equal(isUuid(UUID_1), true);
    assert.equal(isUuid('not-a-uuid'), false);
    assert.equal(isUuid(''), false);
  });

  it('validates real calendar ISO dates', () => {
    assert.equal(isIsoDate('2026-11-13'), true);
    assert.equal(isIsoDate('2024-02-29'), true);
    assert.equal(isIsoDate('2026-02-29'), false);
    assert.equal(isIsoDate('2026-02-31'), false);
    assert.equal(isIsoDate('2026-13-01'), false);
    assert.equal(isIsoDate('13-11-2026'), false);
  });

  it('parses transaction input with optional account and savings fund', () => {
    const fd = new FormData();
    fd.set('transactionDate', '2026-11-13');
    fd.set('categoryId', UUID_1);
    fd.set('accountId', '');
    fd.set('savingsFundId', '');
    fd.set('amount', '150.5');
    fd.set('description', 'Coffee');

    assert.deepEqual(parseTransactionInput(fd), {
      transactionDate: '2026-11-13',
      categoryId: UUID_1,
      accountId: null,
      savingsFundId: null,
      amount: '150.50',
      description: 'Coffee',
    });

    fd.set('accountId', 'bad-id');
    assert.equal(parseTransactionInput(fd), null);

    fd.set('accountId', UUID_2);
    fd.set('amount', '0');
    assert.equal(parseTransactionInput(fd), null);
  });

  it('parses transfer input and rejects identical accounts or negative fees', () => {
    const fd = new FormData();
    fd.set('transferDate', '2026-11-13');
    fd.set('fromAccountId', UUID_1);
    fd.set('toAccountId', UUID_2);
    fd.set('amount', '200');
    fd.set('feeAmount', '5.25');
    fd.set('description', 'ATM');

    assert.deepEqual(parseTransferInput(fd), {
      transferDate: '2026-11-13',
      fromAccountId: UUID_1,
      toAccountId: UUID_2,
      amount: '200.00',
      feeAmount: '5.25',
      description: 'ATM',
    });

    fd.set('toAccountId', UUID_1);
    assert.equal(parseTransferInput(fd), null);

    fd.set('toAccountId', UUID_3);
    fd.set('feeAmount', '-1');
    assert.equal(parseTransferInput(fd), null);
  });

  it('parses budget item input safely', () => {
    const fd = new FormData();
    fd.set('budgetMonth', '2026-11-01');
    fd.set('itemType', 'SPENDING');
    fd.set('targetId', UUID_1);
    fd.set('plannedAmount', '2500');

    assert.deepEqual(parseBudgetItemInput(fd), {
      budgetMonth: '2026-11-01',
      itemType: 'SPENDING',
      targetId: UUID_1,
      plannedAmount: '2500.00',
    });

    fd.set('itemType', 'INVALID');
    assert.equal(parseBudgetItemInput(fd), null);
  });
});
