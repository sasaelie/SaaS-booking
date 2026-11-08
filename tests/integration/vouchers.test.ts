import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { rawInput, reserve } from './fixtures';
import { paidBooking, issuedVoucher, changePrice } from './lifecycle-fixtures';
import { rescheduleVouchers, bookings } from '../../src/adapters/db/schema';
import { DrizzleVoucherRepository } from '../../src/adapters/db/drizzle-voucher.repository';
import { DrizzlePaymentRepository } from '../../src/adapters/db/drizzle-payment.repository';
import { required } from '../../src/adapters/db/transaction';
import { BOOKING_STATUSES, VOUCHER_STATUSES, PAYMENT_MODES } from '../../src/config/constants';
it('issues only one voucher for ten concurrent cancellation retries', async () => {
  const input = await paidBooking();
  const repository = new DrizzleVoucherRepository(db);
  const results = await Promise.all(
    Array.from({ length: 10 }, (_, index) =>
      repository.cancelBookingAtomically({
        organizationId: input.context.organizationId,
        bookingId: input.booking.bookingId,
        version: 0,
        adminOverride: false,
        code: `RPT-ABCD-EFG${index}`,
        now: new Date(),
      }),
    ),
  );
  expect(results.every((result) => result.ok)).toBe(true);
  expect(await db.select().from(rescheduleVouchers)).toHaveLength(1);
});
it('consumes a voucher and confirms a cheaper activity in the same transaction', async () => {
  const input = await issuedVoucher();
  const context = await changePrice(input.context, 2000);
  const booking = required(
    await reserve({ ...rawInput(context), voucherCode: input.voucher.code }),
  );
  expect(booking.status).toBe(BOOKING_STATUSES.CONFIRMED);
  expect(booking.amountToPayCents).toBe(0);
  const [voucher] = await db.select().from(rescheduleVouchers);
  expect(voucher?.status).toBe(VOUCHER_STATUSES.USED_FOR_BOOKING);
});
it('does not consume a voucher when the target session is full', async () => {
  const input = await issuedVoucher();
  const context = await changePrice(input.context, 2000);
  await Promise.all(Array.from({ length: 5 }, () => reserve(rawInput(context))));
  expect((await reserve({ ...rawInput(context), voucherCode: input.voucher.code })).ok).toBe(false);
  const [voucher] = await db.select().from(rescheduleVouchers);
  expect(voucher?.status).toBe(VOUCHER_STATUSES.ACTIVE);
});
it('blocks reservation after external benefit consumption', async () => {
  const input = await issuedVoucher();
  required(
    await new DrizzleVoucherRepository(db).redeemVoucherForExternalBenefitAtomically({
      organizationId: input.context.organizationId,
      code: input.voucher.code,
      now: new Date(),
    }),
  );
  expect((await reserve({ ...rawInput(input.context), voucherCode: input.voucher.code })).ok).toBe(
    false,
  );
});
it('does not let a late payment consume a voucher now locked by another booking', async () => {
  const input = await issuedVoucher(2000);
  const context = await changePrice(input.context, 3000);
  const first = required(await reserve({ ...rawInput(context), voucherCode: input.voucher.code }));
  const past = new Date(Date.now() - 1000);
  await db.update(bookings).set({ lockedUntil: past }).where(eq(bookings.id, first.bookingId));
  await db
    .update(rescheduleVouchers)
    .set({ lockedUntil: past })
    .where(eq(rescheduleVouchers.id, input.voucher.id));
  const second = required(await reserve({ ...rawInput(context), voucherCode: input.voucher.code }));
  const result = required(
    await new DrizzlePaymentRepository(db).confirmPaymentOrDetectCollisionAtomically(
      {
        eventId: crypto.randomUUID(),
        provider: PAYMENT_MODES.STRIPE,
        bookingId: first.bookingId,
        organizationId: context.organizationId,
        paymentReference: 'pi_late',
        checkoutReference: 'cs_late',
        amountPaidCents: 1000,
        currency: 'EUR',
        merchantAccountId: null,
      },
      new Date(),
    ),
  );
  expect(result.status).toBe('REFUND_QUEUED');
  const [voucher] = await db.select().from(rescheduleVouchers);
  expect(voucher?.lockedBookingId).toBe(second.bookingId);
});
