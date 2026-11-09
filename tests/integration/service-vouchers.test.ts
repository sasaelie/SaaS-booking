import { expect, it } from 'vitest';
import { and, eq } from 'drizzle-orm';
import { db } from './database';
import { issuedVoucher, changePrice, paidBooking } from './lifecycle-fixtures';
import { rawInput, reserve, fixture } from './fixtures';
import { required, atomic } from '../../src/adapters/db/transaction';
import { rescheduleVouchers, activities, bookings, outboxJobs } from '../../src/adapters/db/schema';
import { DrizzleVoucherRepository } from '../../src/adapters/db/drizzle-voucher.repository';
import { issueRemainder } from '../../src/adapters/db/vouchers/remainder';
import { ownerOf } from './service-voucher-fixtures';
const expiry = () => new Date(Date.now() + 60 * 86400000).toISOString();
it('creates exactly one spendable remainder with inherited expiry and conserves the value after another cancellation', async () => {
  const original = await issuedVoucher();
  const context = await changePrice(original.context, 2000);
  const input = { ...rawInput(context), voucherCode: original.voucher.code };
  const target = required(await reserve(input));
  required(await reserve(input));
  await Promise.all(
    [0, 1].map(() =>
      atomic(db, 'RemainderTest', async (tx) => {
        await issueRemainder(tx, target.bookingId, context.organizationId);
        return { ok: true as const, value: undefined };
      }),
    ),
  );
  const remainders = await db
    .select()
    .from(rescheduleVouchers)
    .where(eq(rescheduleVouchers.sourceVoucherId, original.voucher.id));
  expect(remainders).toHaveLength(1);
  expect(remainders[0]?.initialValueCents).toBe(1000);
  expect(remainders[0]?.expiresAt.toISOString()).toBe(original.voucher.expiresAt.toISOString());
  const cancelled = required(
    await new DrizzleVoucherRepository(db).cancelBookingAtomically({
      organizationId: context.organizationId,
      bookingId: target.bookingId,
      version: 0,
      adminOverride: false,
      code: 'RPT-ZZZZ-YYYY',
      now: new Date(),
    }),
  );
  expect(cancelled.voucher?.initialValueCents).toBe(2000);
  expect(
    (
      await db.select().from(rescheduleVouchers).where(eq(rescheduleVouchers.status, 'ACTIVE'))
    ).reduce((sum, v) => sum + v.initialValueCents, 0),
  ).toBe(3000);
});
it('prevents concurrent reuse of one voucher for two reservations', async () => {
  const original = await issuedVoucher();
  const context = await changePrice(original.context, 2000);
  const results = await Promise.all(
    [0, 1].map(() => reserve({ ...rawInput(context), voucherCode: original.voucher.code })),
  );
  expect(results.filter((r) => r.ok)).toHaveLength(1);
  expect(
    await db.select().from(rescheduleVouchers).where(eq(rescheduleVouchers.kind, 'REMAINDER')),
  ).toHaveLength(1);
});
it('issues a manually authorized code after a late cancellation once, with chosen expiry and audit trail', async () => {
  const { context, booking } = await paidBooking();
  const owner = await ownerOf(context.organizationId);
  required(
    await new DrizzleVoucherRepository(db).cancelBookingAtomically({
      organizationId: context.organizationId,
      bookingId: booking.bookingId,
      version: 0,
      adminOverride: false,
      code: 'RPT-NONE-NONE',
      now: new Date(context.startsAt.getTime() - 3600000),
    }),
  );
  const input = {
    organizationId: context.organizationId,
    bookingId: booking.bookingId,
    expiresAt: expiry(),
    confirmed: true as const,
  };
  const results = await Promise.all(
    [0, 1].map(() => owner.repository.issueManualVoucher(owner.actor, input)),
  );
  expect(results.every((r) => r.ok)).toBe(true);
  const codes = await db
    .select()
    .from(rescheduleVouchers)
    .where(eq(rescheduleVouchers.originBookingId, booking.bookingId));
  expect(codes).toHaveLength(1);
  expect(codes[0]?.initialValueCents).toBe(3000);
  expect(codes[0]?.expiresAt.toISOString()).toBe(input.expiresAt);
  expect(await db.select().from(outboxJobs).where(eq(outboxJobs.type, 'VOUCHER'))).toHaveLength(1);
  const foreign = await fixture();
  const stranger = await ownerOf(foreign.organizationId);
  expect((await stranger.repository.issueManualVoucher(stranger.actor, input)).ok).toBe(false);
});
it('freezes the accepted cancellation rules even if the activity rules change afterwards', async () => {
  const { context, booking } = await paidBooking();
  await db
    .update(activities)
    .set({ noticeHoursForVoucher: 0, voucherValidityMonths: 12 })
    .where(eq(activities.id, context.activityId));
  const cancelled = required(
    await new DrizzleVoucherRepository(db).cancelBookingAtomically({
      organizationId: context.organizationId,
      bookingId: booking.bookingId,
      version: 0,
      adminOverride: false,
      code: 'RPT-AAAA-BBBB',
      now: new Date(context.startsAt.getTime() - 24 * 3600000),
    }),
  );
  expect(cancelled.voucherIssued).toBe(false);
  const [saved] = await db.select().from(bookings).where(eq(bookings.id, booking.bookingId));
  expect(saved?.noticeHoursForVoucher).toBe(72);
  expect(saved?.voucherValidityMonths).toBe(3);
});
it('does not turn an unpaid or refunded cancellation into a manual credit', async () => {
  const context = await fixture();
  const owner = await ownerOf(context.organizationId);
  const booking = required(await reserve(rawInput(context)));
  await db
    .update(bookings)
    .set({ status: 'CANCELLED_BY_ATTENDEE' })
    .where(eq(bookings.id, booking.bookingId));
  expect(
    (
      await owner.repository.issueManualVoucher(owner.actor, {
        organizationId: context.organizationId,
        bookingId: booking.bookingId,
        expiresAt: expiry(),
        confirmed: true,
      })
    ).ok,
  ).toBe(false);
  await db
    .update(bookings)
    .set({ amountPaidCents: 3000, refundStatus: 'REFUNDED' })
    .where(
      and(eq(bookings.id, booking.bookingId), eq(bookings.organizationId, context.organizationId)),
    );
  expect(
    (
      await owner.repository.issueManualVoucher(owner.actor, {
        organizationId: context.organizationId,
        bookingId: booking.bookingId,
        expiresAt: expiry(),
        confirmed: true,
      })
    ).ok,
  ).toBe(false);
});
it('refuses an expired manual attribution without creating an extra credit', async () => {
  const { context, booking } = await paidBooking();
  const owner = await ownerOf(context.organizationId);
  await db
    .update(bookings)
    .set({ status: 'CANCELLED_BY_ATTENDEE' })
    .where(eq(bookings.id, booking.bookingId));
  expect(
    (
      await owner.repository.issueManualVoucher(owner.actor, {
        organizationId: context.organizationId,
        bookingId: booking.bookingId,
        expiresAt: new Date(Date.now() - 86400000).toISOString(),
        confirmed: true,
      })
    ).ok,
  ).toBe(false);
  expect(await db.select().from(rescheduleVouchers)).toHaveLength(0);
});
