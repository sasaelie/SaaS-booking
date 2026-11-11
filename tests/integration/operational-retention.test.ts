import { expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { paidBooking } from './lifecycle-fixtures';
import {
  bookings,
  sessions,
  accountingArchives,
  outboxJobs,
  rescheduleVouchers,
} from '../../src/adapters/db/schema';
import { retainOperational } from '../../src/adapters/db/operational-retention';
import { accountingArchiveUntil } from '../../src/core/domain/accounting-retention';
import { required } from '../../src/adapters/db/transaction';
async function oldClosedBooking() {
  const context = await fixture();
  const booking = required(await reserve(rawInput(context)));
  const old = new Date(Date.now() - 60 * 86400000);
  await db
    .update(sessions)
    .set({ startsAt: new Date(old.getTime() - 3600000), endsAt: old })
    .where(eq(sessions.id, booking.sessionId));
  await db.update(bookings).set({ createdAt: old }).where(eq(bookings.id, booking.bookingId));
  return { context, booking };
}
it('simulates first, erases operational contacts after closure, and repeats without duplicate purge', async () => {
  const { booking } = await oldClosedBooking();
  const preview = required(await retainOperational(db, new Date(), true));
  expect(preview.eligible).toHaveLength(1);
  expect(preview.anonymizedCount).toBe(0);
  expect((await db.select().from(bookings))[0]?.email).toBe('test@example.com');
  expect(required(await retainOperational(db, new Date(), false)).anonymizedCount).toBe(1);
  expect((await db.select().from(bookings))[0]).toMatchObject({
    email: 'anonymous@invalid.local',
    firstName: '[anonymous]',
  });
  expect(required(await retainOperational(db, new Date(), false)).anonymizedCount).toBe(0);
  expect(booking.bookingId).toBeTruthy();
});
it('does not erase a future event merely because the registration is old', async () => {
  const context = await fixture();
  const booking = required(await reserve(rawInput(context)));
  await db
    .update(bookings)
    .set({ createdAt: new Date('2020-01-01') })
    .where(eq(bookings.id, booking.bookingId));
  expect(required(await retainOperational(db, new Date(), false)).anonymizedCount).toBe(0);
});
it('protects legal holds and active vouchers', async () => {
  const old = await oldClosedBooking();
  await db.update(bookings).set({ legalHold: true }).where(eq(bookings.id, old.booking.bookingId));
  expect(required(await retainOperational(db, new Date(), false)).anonymizedCount).toBe(0);
  await db.update(bookings).set({ legalHold: false }).where(eq(bookings.id, old.booking.bookingId));
  await db.insert(rescheduleVouchers).values({
    organizationId: old.context.organizationId,
    originActivityId: old.context.activityId,
    originBookingId: old.booking.bookingId,
    code: 'RPT-HOLD-TEST',
    initialValueCents: 3000,
    currency: 'EUR',
    expiresAt: new Date(Date.now() + 86400000),
  });
  expect(required(await retainOperational(db, new Date(), false)).anonymizedCount).toBe(0);
});
it('retains the minimal fiscal identity separately while erasing operational contacts', async () => {
  const input = await paidBooking();
  const old = new Date(Date.now() - 60 * 86400000);
  await db
    .update(sessions)
    .set({ startsAt: new Date(old.getTime() - 3600000), endsAt: old })
    .where(eq(sessions.id, input.booking.sessionId));
  await db
    .update(bookings)
    .set({ paidAt: old, createdAt: old })
    .where(eq(bookings.id, input.booking.bookingId));
  await db.execute(sql`UPDATE financial_entries SET created_at=${old}`);
  await db.update(outboxJobs).set({ completedAt: new Date() });
  expect(required(await retainOperational(db, new Date(), false)).anonymizedCount).toBe(1);
  expect((await db.select().from(bookings))[0]?.email).toBe('anonymous@invalid.local');
  const [archive] = await db.select().from(accountingArchives);
  expect(archive?.requiredIdentity).toEqual({ firstName: 'Test', lastName: 'Customer' });
  expect(archive?.archiveUntil.getTime()).toBe(accountingArchiveUntil(old, old).getTime());
});
