import { expect, it } from 'vitest';

import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { bookings, sessions } from '../../src/adapters/db/schema';
import { ERROR_CODES, BOOKING_STATUSES } from '../../src/config/constants';
it('serializes ten real transactions into exactly five seats and one session', async () => {
  const context = await fixture();
  const results = await Promise.all(Array.from({ length: 10 }, () => reserve(rawInput(context))));
  expect(results.filter((result) => result.ok)).toHaveLength(5);
  expect(
    results.filter((result) => !result.ok && result.error.code === ERROR_CODES.SESSION_FULL),
  ).toHaveLength(5);
  expect(await db.select().from(sessions)).toHaveLength(1);
  expect(await db.select().from(bookings)).toHaveLength(5);
});
it('returns one booking for ten concurrent retries of the same request', async () => {
  const context = await fixture();
  const input = rawInput(context);
  const results = await Promise.all(Array.from({ length: 10 }, () => reserve(input)));
  expect(results.every((result) => result.ok)).toBe(true);
  expect(await db.select().from(bookings)).toHaveLength(1);
});
it('rejects changed content for an existing idempotency key', async () => {
  const context = await fixture();
  const input = rawInput(context);
  expect((await reserve(input)).ok).toBe(true);
  const result = await reserve({ ...input, firstName: 'Another' });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.code).toBe(ERROR_CODES.CONFLICT);
});
it('does not record an offline confirmation as money received', async () => {
  const context = await fixture();
  expect((await reserve(rawInput(context))).ok).toBe(true);
  const [booking] = await db.select().from(bookings);
  expect(booking?.status).toBe(BOOKING_STATUSES.CONFIRMED);
  expect(booking?.amountPaidCents).toBe(0);
});
it('rejects an activity from another organization before creating a session', async () => {
  const first = await fixture();
  const second = await fixture();
  const result = await reserve({ ...rawInput(first), organizationId: second.organizationId });
  expect(result.ok).toBe(false);
  expect(await db.select().from(sessions)).toHaveLength(0);
});
it('rejects stale conditions without leaving a booking or a session', async () => {
  const context = await fixture();
  const result = await reserve({ ...rawInput(context), acceptedTermsVersionHash: 'b'.repeat(64) });
  expect(result.ok).toBe(false);
  expect(await db.select().from(sessions)).toHaveLength(0);
  expect(await db.select().from(bookings)).toHaveLength(0);
});
