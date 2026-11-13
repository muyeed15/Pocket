import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createSessionToken,
  hashPassword,
  verifyPassword,
  verifySessionToken,
} from '@/lib/session';

describe('session & password utilities', () => {
  it('hashes passwords with unique salts and verifies correctly', () => {
    const hash1 = hashPassword('correct-horse-battery-staple');
    const hash2 = hashPassword('correct-horse-battery-staple');

    assert.notEqual(hash1, hash2);
    assert.equal(verifyPassword('correct-horse-battery-staple', hash1), true);
    assert.equal(verifyPassword('correct-horse-battery-staple', hash2), true);
    assert.equal(verifyPassword('wrong-password', hash1), false);
  });

  it('rejects malformed stored password hashes', () => {
    assert.equal(verifyPassword('anything', ''), false);
    assert.equal(verifyPassword('anything', 'no-colon-separator'), false);
    assert.equal(verifyPassword('anything', 'salt:deadbeef'), false);
  });

  it('signs and verifies valid session tokens', () => {
    const token = createSessionToken('user-abc-123');
    const result = verifySessionToken(token);
    assert.deepEqual(result, { userId: 'user-abc-123' });
  });

  it('rejects tampered or malformed session tokens', () => {
    const token = createSessionToken('user-abc-123');
    const [payload, sig] = token.split('.');

    assert.equal(verifySessionToken(''), null);
    assert.equal(verifySessionToken('only-one-part'), null);
    assert.equal(verifySessionToken(`${payload}.tampered${sig}`), null);

    const forgedPayload = Buffer.from(
      JSON.stringify({ userId: 'other-user', exp: Date.now() + 60_000 }),
      'utf8'
    ).toString('base64url');
    assert.equal(verifySessionToken(`${forgedPayload}.${sig}`), null);
  });

  it('rejects expired session tokens', () => {
    const expiredPayload = Buffer.from(
      JSON.stringify({ userId: 'user-abc-123', exp: Date.now() - 1000 }),
      'utf8'
    ).toString('base64url');
    const validToken = createSessionToken('user-abc-123');
    const [, sig] = validToken.split('.');

    assert.equal(verifySessionToken(`${expiredPayload}.${sig}`), null);
  });
});
