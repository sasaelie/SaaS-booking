import { expect, it } from 'vitest';
import { fixture, rawInput, reserve } from './fixtures';
import { db } from './database';
import { readActivitySchedule } from '../../src/adapters/db/activity-schedule';
import { required } from '../../src/adapters/db/transaction';
it('keeps seat information while excluding identities and payment capabilities from schedule data', async () => {
  const context = await fixture();
  const booking = required(await reserve(rawInput(context)));
  const schedule = await readActivitySchedule(db, context.organizationId, context.activityId);
  const snapshots = schedule.bookingsBySessionId[booking.sessionId];
  expect(snapshots).toHaveLength(1);
  expect(snapshots?.[0]).toMatchObject({ status: 'CONFIRMED', sessionId: booking.sessionId });
  for (const key of [
    'email',
    'phone',
    'firstName',
    'lastName',
    'proofStorageKey',
    'checkoutUrl',
    'requestHash',
  ])
    expect(snapshots?.[0]).not.toHaveProperty(key);
});
