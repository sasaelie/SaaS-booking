import { expect, it } from 'vitest';
import { sql, eq } from 'drizzle-orm';
import { db } from './database';
import { withVoucher, past, repository, secret } from './participant-fixtures';
import {
  rescheduleVouchers,
  bookings,
  sessions,
  financialEntries,
} from '../../src/adapters/db/schema';
import { required } from '../../src/adapters/db/transaction';
import { mailContent } from '../../src/adapters/jobs/mail-content';
it('provides a new code for a newly awarded credit without reviving a closed code or session', async () => {
  const setup = await withVoucher();
  const auth = required(await repository().exchange(setup.ticket.code, null, new Date()));
  await past(setup.booking.sessionId);
  await db
    .update(rescheduleVouchers)
    .set({ status: 'USED_FOR_EXTERNAL_BENEFIT', usedAt: new Date() })
    .where(eq(rescheduleVouchers.id, setup.voucher.id));
  await db.execute(
    sql`UPDATE booking_access_credentials SET closed_at=now() WHERE booking_id=${setup.booking.bookingId}`,
  );
  expect((await repository().authorizeCode(setup.ticket.code, new Date())).ok).toBe(false);
  const credit = await awardCredit(setup);
  const ticket = required(await repository().ticket({ ...setup.payload, version: 1 }, new Date()));
  expect(ticket?.code).not.toBe(setup.ticket.code);
  expect(ticket?.vouchers).toEqual(
    expect.arrayContaining([expect.objectContaining({ valueCents: 1000 })]),
  );
  expect((await repository().authorizeCode(setup.ticket.code, new Date())).ok).toBe(false);
  expect(
    (await repository().authorize(auth.browserToken, setup.booking.bookingId, new Date())).ok,
  ).toBe(false);
  const mail = await mailContent(
    db,
    'VOUCHER',
    { voucherId: credit?.id },
    'https://example.test',
    secret,
  );
  expect(mail?.text).toContain(ticket?.code);
  const events = await db.execute(
    sql`SELECT action FROM booking_access_events WHERE booking_id=${setup.booking.bookingId}`,
  );
  expect(events.rows).toEqual(
    expect.arrayContaining([expect.objectContaining({ action: 'NEW_CREDIT_ACCESS_ROTATED' })]),
  );
});

async function awardCredit(setup: Awaited<ReturnType<typeof withVoucher>>) {
  const [credit] = await db
    .insert(rescheduleVouchers)
    .values({
      organizationId: setup.context.organizationId,
      originActivityId: setup.context.activityId,
      originBookingId: setup.booking.bookingId,
      kind: 'REMAINDER',
      sourceVoucherId: setup.voucher.id,
      code: 'RPT-NEWC-REDIT',
      initialValueCents: 1000,
      currency: 'EUR',
      expiresAt: new Date(Date.now() + 86400000),
    })
    .returning();
  return credit;
}
it('rotates an automatically closed code before granting a new credit after the recovery period', async () => {
  const setup = await withVoucher();
  await ageSettledBooking(setup);
  expect((await repository().authorizeCode(setup.ticket.code, new Date())).ok).toBe(false);
  const before = await db.execute(
    sql`SELECT closed_at FROM booking_access_credentials WHERE booking_id=${setup.booking.bookingId}`,
  );
  expect(before.rows[0]?.['closed_at']).toBeNull();
  await awardCredit(setup);
  const ticket = required(await repository().ticket({ ...setup.payload, version: 1 }, new Date()));
  expect(ticket?.code).not.toBe(setup.ticket.code);
  expect((await repository().authorizeCode(setup.ticket.code, new Date())).ok).toBe(false);
  expect(ticket?.code && (await repository().authorizeCode(ticket.code, new Date())).ok).toBe(true);
});
async function ageSettledBooking(setup: Awaited<ReturnType<typeof withVoucher>>) {
  const old = new Date(Date.now() - 60 * 86400000);
  await db
    .update(rescheduleVouchers)
    .set({ status: 'USED_FOR_EXTERNAL_BENEFIT', usedAt: old })
    .where(eq(rescheduleVouchers.id, setup.voucher.id));
  await db
    .update(bookings)
    .set({ paidAt: old, cancelledAt: old })
    .where(eq(bookings.id, setup.booking.bookingId));
  await db.update(financialEntries).set({ createdAt: old });
  await db
    .update(sessions)
    .set({ startsAt: new Date(old.getTime() - 3600000), endsAt: old })
    .where(eq(sessions.id, setup.booking.sessionId));
}
