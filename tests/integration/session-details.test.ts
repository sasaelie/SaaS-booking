import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { ownerOf } from './service-voucher-fixtures';
import { required } from '../../src/adapters/db/transaction';
import { bookings, sessions } from '../../src/adapters/db/schema';
import { DrizzleClosureRepository } from '../../src/adapters/db/drizzle-closure.repository';
import { SAAS } from '../../src/config/constants';
async function detailFixture() {
  const context = await fixture();
  const owner = await ownerOf(context.organizationId);
  const input = {
    organizationId: context.organizationId,
    activityId: context.activityId,
    startsAt: context.startsAt.toISOString(),
    page: 1,
  };
  const details = (page = 1) => owner.repository.sessionDetails(owner.actor, { ...input, page });
  return { context, owner, input, details };
}
it('reads an empty generated session without creating database sessions or reservations', async () => {
  const c = await detailFixture();
  const result = required(await c.details());
  expect(result.session.id).toBeNull();
  expect(result.session.capacity).toBe(5);
  expect(result.bookings.total).toBe(0);
  expect(await db.select().from(sessions)).toHaveLength(0);
  expect(await db.select().from(bookings)).toHaveLength(0);
});
it('keeps attendees of other dates and other organizations out of the detail page', async () => {
  const c = await detailFixture();
  const first = required(await reserve({ ...rawInput(c.context), email: 'first@example.com' }));
  required(
    await reserve({
      ...rawInput(c.context),
      email: 'next@example.com',
      startsAtIso: new Date(c.context.startsAt.getTime() + 7 * 86400000).toISOString(),
    }),
  );
  const result = required(await c.details());
  expect(result.bookings.bookings.map((booking) => booking.id)).toEqual([first.bookingId]);
  const foreign = await fixture();
  const stranger = await ownerOf(foreign.organizationId);
  expect((await stranger.repository.sessionDetails(stranger.actor, c.input)).ok).toBe(false);
  expect(
    (
      await c.owner.repository.sessionDetails(c.owner.actor, {
        ...c.input,
        activityId: foreign.activityId,
      })
    ).ok,
  ).toBe(false);
});
it('keeps a cancelled session and its attendee history readable after closure', async () => {
  const c = await detailFixture();
  const booking = required(await reserve(rawInput(c.context)));
  const repo = new DrizzleClosureRepository(db);
  const command = {
    organizationId: c.context.organizationId,
    sessionId: booking.sessionId,
    reason: 'Teacher unavailable',
    confirmCancelExistingBookings: false,
  };
  const preview = required(await repo.closeSessionAtomically(command));
  if (preview.status !== 'CONFIRMATION_REQUIRED') throw Error('Expected confirmation');
  required(
    await repo.closeSessionAtomically({
      ...command,
      confirmCancelExistingBookings: true,
      confirmationHash: preview.confirmationHash,
    }),
  );
  const result = required(await c.details());
  expect(result.session.isCancelled).toBe(true);
  expect(result.bookings.bookings[0]?.status).toBe('CANCELLED_BY_ORGANIZER');
});
it('paginates a single session without dropping its exact date', async () => {
  const c = await detailFixture();
  required(await reserve(rawInput(c.context)));
  const [original] = await db.select().from(bookings);
  if (!original) throw Error('Missing booking');
  await db.update(sessions).set({ capacity: 100 }).where(eq(sessions.id, original.sessionId));
  await db.insert(bookings).values(
    Array.from({ length: SAAS.PAGE_SIZE }, (_, index) => ({
      ...original,
      id: crypto.randomUUID(),
      idempotencyKey: crypto.randomUUID(),
      email: `page-${index}@example.com`,
    })),
  );
  const first = required(await c.details());
  const second = required(await c.details(2));
  expect(first.bookings.total).toBe(SAAS.PAGE_SIZE + 1);
  expect(first.bookings.bookings).toHaveLength(SAAS.PAGE_SIZE);
  expect(second.bookings.bookings).toHaveLength(1);
  expect(
    new Set([...first.bookings.bookings, ...second.bookings.bookings].map((booking) => booking.id))
      .size,
  ).toBe(SAAS.PAGE_SIZE + 1);
  expect(
    second.bookings.bookings.every(
      (booking) => booking.startsAt.toISOString() === c.input.startsAt,
    ),
  ).toBe(true);
});
