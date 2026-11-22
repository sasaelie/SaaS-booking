import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { request } from './fixtures';
import { sessions, rescheduleVouchers, activities, bookings } from '../../src/adapters/db/schema';
import { DrizzleSelfBookingRepository } from '../../src/adapters/db/drizzle-self-booking.repository';
import { DrizzleSessionRepository } from '../../src/adapters/db/drizzle-session.repository';
import { retainOperational } from '../../src/adapters/db/operational-retention';
import { required } from '../../src/adapters/db/transaction';
import {
  confirmed,
  withVoucher,
  past,
  repository,
  secret,
  cheaperReservation,
} from './participant-fixtures';
it('does not close access for absent, created or payment-locked reports, including legacy links', async () => {
  const setup = await withVoucher();
  await past(setup.booking.sessionId);
  expect((await repository().authorizeCode(setup.ticket.code, new Date())).ok).toBe(true);
  await db
    .update(rescheduleVouchers)
    .set({
      status: 'LOCKED_PENDING_PAYMENT',
      lockedUntil: new Date(Date.now() + 3600000),
      lockedBookingId: setup.booking.bookingId,
    })
    .where(eq(rescheduleVouchers.id, setup.voucher.id));
  expect((await repository().authorizeCode(setup.ticket.code, new Date())).ok).toBe(true);
  await db
    .update(rescheduleVouchers)
    .set({
      status: 'USED_FOR_EXTERNAL_BENEFIT',
      usedAt: new Date(),
      lockedUntil: null,
      lockedBookingId: null,
    })
    .where(eq(rescheduleVouchers.id, setup.voucher.id));
  expect((await repository().authorizeCode(setup.ticket.code, new Date())).ok).toBe(true);
  expect((await new DrizzleSelfBookingRepository(db).read(setup.payload)).ok).toBe(true);
  await db
    .update(sessions)
    .set({
      startsAt: setup.context.startsAt,
      endsAt: new Date(setup.context.startsAt.getTime() + 7200000),
    })
    .where(eq(sessions.id, setup.booking.sessionId));
  expect((await repository().authorizeCode(setup.ticket.code, new Date())).ok).toBe(true);
});

it('closes fully settled historical access after 30 days and permits automatic anonymization', async () => {
  const setup = await confirmed();
  await past(setup.booking.sessionId);
  await db
    .update(bookings)
    .set({ amountPaidCents: 3000, paidAt: new Date() })
    .where(eq(bookings.id, setup.booking.bookingId));
  const future = new Date(Date.now() + 5184000000);
  expect((await repository().authorizeCode(setup.ticket.code, future)).ok).toBe(false);
  const candidates = required(await retainOperational(db, future, true));
  expect(candidates.eligible.map((b) => b.bookingId)).toContain(setup.booking.bookingId);
});

it('uses a client code as a report, preserves idempotency, and moves the remainder to the new ticket', async () => {
  const setup = await withVoucher();
  await past(setup.booking.sessionId);
  const raw = await cheaperReservation(setup);
  const repo = new DrizzleSessionRepository(db, { secret });
  const result = required(await repo.reserveSeatAtomically(await request(raw)));
  expect(result.status).toBe('CONFIRMED');
  expect(required(await repo.reserveSeatAtomically(await request(raw))).bookingId).toBe(
    result.bookingId,
  );
  expect((await repository().authorizeCode(setup.ticket.code, new Date())).ok).toBe(true);
  const next = required(
    await repository().ticket({ ...setup.payload, bookingId: result.bookingId }, new Date()),
  );
  expect(next?.code).not.toBe(setup.ticket.code);
  expect(next?.vouchers).toEqual(
    expect.arrayContaining([expect.objectContaining({ valueCents: 1500, status: 'ACTIVE' })]),
  );
  expect(next?.unitPriceCents).toBe(1500);
  expect(next?.voucherDiscountCents).toBe(1500);
});

it('keeps delayed addresses hidden and emits only safe public contact links', async () => {
  const setup = await confirmed();
  await db
    .update(activities)
    .set({ address: 'Lieu privé', addressVisibility: 'REMINDER' })
    .where(eq(activities.id, setup.context.activityId));
  const hidden = required(await repository().ticket(setup.payload, new Date()));
  expect(hidden?.address).toBeNull();
  const revealed = required(
    await repository().ticket(setup.payload, new Date(setup.context.startsAt.getTime() - 3600000)),
  );
  expect(revealed?.address).toBe('Lieu privé');
});
