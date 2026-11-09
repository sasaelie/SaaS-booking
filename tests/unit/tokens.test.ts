import { expect, it } from 'vitest';
import {
  signSelfCancelToken,
  verifySelfCancelToken,
} from '../../src/core/domain/self-service-token';
import { computeVoucherExpiryDate } from '../../src/core/domain/voucher-engine';
const secret = 'test-secret-32-characters-minimum-only';
const now = new Date('2026-11-09T10:00:00Z');
const payload = {
  organizationId: '11111111-1111-4111-8111-111111111111',
  bookingId: '22222222-2222-4222-8222-222222222222',
  version: 0,
  expUnixSeconds: Math.floor(now.getTime() / 1000) + 3600,
};
it('signs and verifies a valid payload', async () => {
  const token = await signSelfCancelToken(payload, secret);
  expect(token.ok).toBe(true);
  if (token.ok)
    expect(await verifySelfCancelToken(token.value, secret, now)).toEqual({
      ok: true,
      value: payload,
    });
});
it('rejects tampering, expiration and invalid schema', async () => {
  const token = await signSelfCancelToken(payload, secret);
  if (!token.ok) throw Error('fixture');
  expect((await verifySelfCancelToken(token.value + 'x', secret, now)).ok).toBe(false);
  expect(
    (await verifySelfCancelToken(token.value, secret, new Date(payload.expUnixSeconds * 1000))).ok,
  ).toBe(false);
  expect((await signSelfCancelToken({ ...payload, expUnixSeconds: NaN }, secret)).ok).toBe(false);
});
it('clamps month expiry to the last real day', () => {
  expect(computeVoucherExpiryDate(new Date('2026-01-31T10:00:00Z')).toISOString()).toBe(
    '2026-03-31T10:00:00.000Z',
  );
  expect(computeVoucherExpiryDate(new Date('2026-01-31T10:00:00Z'), 3).toISOString()).toBe(
    '2026-04-30T10:00:00.000Z',
  );
});
