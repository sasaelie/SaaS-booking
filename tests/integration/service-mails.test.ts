import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import {
  activities,
  bookings,
  sessions,
  outboxJobs,
  organizations,
} from '../../src/adapters/db/schema';
import { fixture, rawInput, reserve } from './fixtures';
import { required } from '../../src/adapters/db/transaction';
import { mailContent } from '../../src/adapters/jobs/mail-content';
import { scheduleReminders } from '../../src/adapters/db/jobs/reminders';
import { GetBookingPageUseCase } from '../../src/core/use-cases/get-booking-page.use-case';
import { DrizzleActivityRepository } from '../../src/adapters/db/drizzle-activity.repository';
const url = 'https://booking.example.com',
  secret = 'test-only-long-enough-secret-not-production';
async function eventFixture() {
  const context = await fixture();
  const booking = required(await reserve(rawInput(context)));
  await db
    .update(activities)
    .set({
      address: 'Private venue 123',
      addressVisibility: 'REMINDER',
      practicalInfo: 'Bring your tools',
    })
    .where(eq(activities.id, context.activityId));
  return { ...context, booking };
}
it('excludes a delayed address from public data and early confirmation while explaining the later email', async () => {
  const c = await eventFixture();
  const page = required(
    await new GetBookingPageUseCase(new DrizzleActivityRepository(db)).execute({
      slug: c.organizationId,
      activityId: c.activityId,
    }),
  );
  expect(JSON.stringify(page)).not.toContain('Private venue');
  expect(page.addressDelayed).toBe(true);
  const confirmation = await mailContent(
    db,
    'CONFIRMATION',
    { bookingId: c.booking.bookingId },
    url,
    secret,
  );
  expect(confirmation?.text).not.toContain('Private venue');
  expect(confirmation?.text).toContain('24 heures');
  expect(confirmation?.text).toContain('Reste à régler');
});
it('schedules one reminder per session date and omits cancelled, rescheduled and late bookings', async () => {
  const c = await eventFixture();
  const startsAt = new Date(Date.now() + 23 * 3600000);
  await db
    .update(sessions)
    .set({ startsAt, endsAt: new Date(startsAt.getTime() + 7200000) })
    .where(eq(sessions.id, c.booking.sessionId));
  await db
    .update(bookings)
    .set({ confirmedAt: new Date(Date.now() - 2 * 86400000) })
    .where(eq(bookings.id, c.booking.bookingId));
  required(await scheduleReminders(db));
  required(await scheduleReminders(db));
  const pending = await db.select().from(outboxJobs).where(eq(outboxJobs.type, 'REMINDER'));
  expect(pending).toHaveLength(1);
  const reminder = await mailContent(db, 'REMINDER', pending[0]?.payload, url, secret);
  expect(reminder?.text).toContain('Private venue');
  expect(reminder?.text).toContain('Bring your tools');
  const stale = {
    bookingId: c.booking.bookingId,
    startsAt: new Date(startsAt.getTime() - 3600000).toISOString(),
  };
  expect(await mailContent(db, 'REMINDER', stale, url, secret)).toBeNull();
  await db
    .update(bookings)
    .set({ status: 'CANCELLED_BY_ATTENDEE' })
    .where(eq(bookings.id, c.booking.bookingId));
  expect(await mailContent(db, 'REMINDER', pending[0]?.payload, url, secret)).toBeNull();
});
it('includes the private venue in late confirmation and does not schedule a redundant reminder', async () => {
  const c = await eventFixture();
  const startsAt = new Date(Date.now() + 3 * 3600000);
  await db
    .update(sessions)
    .set({ startsAt, endsAt: new Date(startsAt.getTime() + 7200000) })
    .where(eq(sessions.id, c.booking.sessionId));
  required(await scheduleReminders(db));
  expect(await db.select().from(outboxJobs).where(eq(outboxJobs.type, 'REMINDER'))).toHaveLength(0);
  expect(
    (await mailContent(db, 'CONFIRMATION', { bookingId: c.booking.bookingId }, url, secret))?.text,
  ).toContain('Private venue');
});
it('keeps saved participation conditions on existing reservations after an edit', async () => {
  const c = await eventFixture();
  const [before] = await db.select().from(bookings).where(eq(bookings.id, c.booking.bookingId));
  await db
    .update(activities)
    .set({ participationTerms: 'New participation instructions' })
    .where(eq(activities.id, c.activityId));
  const page = required(
    await new GetBookingPageUseCase(new DrizzleActivityRepository(db)).execute({
      slug: c.organizationId,
      activityId: c.activityId,
    }),
  );
  expect(page.terms.fullText).toContain('New participation instructions');
  expect(page.terms.versionHash).not.toBe(before?.termsVersionHash);
  const [after] = await db.select().from(bookings).where(eq(bookings.id, c.booking.bookingId));
  expect(after?.termsText).toBe(before?.termsText);
});

it('formats participant event details in the organization timezone across the summer-time change', async () => {
  const c = await eventFixture();
  await db
    .update(organizations)
    .set({ timezone: 'Europe/Brussels' })
    .where(eq(organizations.id, c.organizationId));
  await db
    .update(sessions)
    .set({ startsAt: new Date('2027-03-28T09:00:00Z'), endsAt: new Date('2027-03-28T11:00:00Z') })
    .where(eq(sessions.id, c.booking.sessionId));
  const content = await mailContent(
    db,
    'CONFIRMATION',
    { bookingId: c.booking.bookingId },
    url,
    secret,
  );
  expect(content?.text).toContain('11:00');
  expect(content?.text).toContain('13:00');
  expect(content?.text).toContain('Europe/Brussels');
});
