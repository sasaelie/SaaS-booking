import { SessionEditUseCase } from '../../src/core/use-cases/portal/session-edit.use-case';
import { ok } from '../../src/lib/result';
import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { fixture, reserve, rawInput } from './fixtures';
import { ownerOf } from './service-voucher-fixtures';
import { db } from './database';
import { required } from '../../src/adapters/db/transaction';
import { bookings, sessions, outboxJobs, organizations } from '../../src/adapters/db/schema';
import { DrizzleSessionEditRepository } from '../../src/adapters/db/drizzle-session-edit.repository';
import { DrizzleActivityRepository } from '../../src/adapters/db/drizzle-activity.repository';
import { publicSchedule } from '../../src/core/domain/public-booking-page';
import { SessionEditSchema } from '../../src/core/validation/session-edit';
import type { SessionEditCommand } from '../../src/core/ports/session-edit.port';
async function setup(mode: 'NONE' | 'STRIPE' = 'NONE') {
  const context = await fixture(mode);
  const booking = required(await reserve(rawInput(context)));
  const { actor, repository: portalRepository } = await ownerOf(context.organizationId);
  const [session] = await db.select().from(sessions).where(eq(sessions.id, booking.sessionId));
  if (!session) throw Error('Missing test session');
  const input: SessionEditCommand = {
    ...SessionEditSchema.parse({
      action: 'update-session',
      organizationId: context.organizationId,
      activityId: context.activityId,
      startsAt: session.startsAt.toISOString(),
      endsAt: session.endsAt.toISOString(),
      capacity: session.capacity,
      newStart: '2026-12-01T14:00',
      newEnd: '2026-12-01T16:00',
      newCapacity: session.capacity,
    }),
    newStartsAt: new Date(session.startsAt.getTime() + 86400000),
    newEndsAt: new Date(session.endsAt.getTime() + 86400000),
  };
  return {
    context,
    booking,
    actor,
    session,
    input,
    repository: new DrizzleSessionEditRepository(db),
    portalRepository,
  };
}
it('requires a current impact confirmation, preserves the ticket and price, and blocks regeneration', async () => {
  const s = await setup();
  const preview = required(await s.repository.update(s.actor, s.input));
  expect(preview.status).toBe('CONFIRMATION_REQUIRED');
  if (preview.status !== 'CONFIRMATION_REQUIRED') throw Error('Expected impact preview');
  expect(preview.affectedBookingsCount).toBe(1);
  required(
    await s.repository.update(s.actor, {
      ...s.input,
      confirmCancelExistingBookings: true,
      confirmationHash: preview.confirmationHash,
    }),
  );
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, s.booking.bookingId));
  expect(booking).toMatchObject({
    sessionId: s.session.id,
    unitPriceCents: 3000,
    status: 'CONFIRMED',
  });
  const activity = required(
    await new DrizzleActivityRepository(db).getActivityWithScheduleConfig(
      s.context.organizationId,
      s.context.activityId,
    ),
  );
  const schedule = required(publicSchedule(activity, new Date()));
  expect(schedule.some((row) => row.startsAt.getTime() === s.session.startsAt.getTime())).toBe(
    false,
  );
  expect(schedule.some((row) => row.startsAt.getTime() === s.input.newStartsAt.getTime())).toBe(
    true,
  );
  expect(
    (await db.select().from(outboxJobs)).filter((row) => row.type === 'EVENT_UPDATE'),
  ).toHaveLength(1);
});
it('rejects a stale confirmation when another participant books', async () => {
  const s = await setup();
  const preview = required(await s.repository.update(s.actor, s.input));
  if (preview.status !== 'CONFIRMATION_REQUIRED') throw Error('Expected preview');
  required(await reserve(rawInput(s.context)));
  const refreshed = required(
    await s.repository.update(s.actor, {
      ...s.input,
      confirmCancelExistingBookings: true,
      confirmationHash: preview.confirmationHash,
    }),
  );
  expect(refreshed.status).toBe('CONFIRMATION_REQUIRED');
  expect(
    (await db.select().from(sessions)).find((row) => row.id === s.session.id)?.startsAt,
  ).toEqual(s.session.startsAt);
});
it('protects occupied places and rejects outsiders', async () => {
  const s = await setup();
  required(await reserve(rawInput(s.context)));
  expect((await s.repository.update(s.actor, { ...s.input, newCapacity: 1 })).ok).toBe(false);
  expect((await s.repository.update({ ...s.actor, id: crypto.randomUUID() }, s.input)).ok).toBe(
    false,
  );
});
it('blocks a date change during an active Stripe payment hold', async () => {
  const s = await setup('STRIPE');
  expect((await s.repository.update(s.actor, s.input)).ok).toBe(false);
  expect((await db.select().from(bookings))[0]?.status).toBe('PENDING_PAYMENT');
});

it('uses the organization timezone and rejects a nonexistent local time', async () => {
  const s = await setup();
  await db
    .update(organizations)
    .set({ timezone: 'Europe/Brussels' })
    .where(eq(organizations.id, s.context.organizationId));
  const useCase = new SessionEditUseCase(
    { current: async () => ok(s.actor) },
    s.portalRepository,
    s.repository,
  );
  const preview = required(await useCase.execute(s.input));
  if (preview.status !== 'CONFIRMATION_REQUIRED') throw Error('Expected preview');
  required(
    await useCase.execute({
      ...s.input,
      confirmCancelExistingBookings: true,
      confirmationHash: preview.confirmationHash,
    }),
  );
  const [row] = await db.select().from(sessions).where(eq(sessions.id, s.session.id));
  expect(row?.startsAt.toISOString()).toBe('2026-12-01T13:00:00.000Z');
  expect(
    (
      await useCase.execute({
        ...s.input,
        startsAt: row?.startsAt.toISOString(),
        endsAt: row?.endsAt.toISOString(),
        newStart: '2027-03-28T02:30',
        newEnd: '2027-03-28T04:00',
      })
    ).ok,
  ).toBe(false);
});
