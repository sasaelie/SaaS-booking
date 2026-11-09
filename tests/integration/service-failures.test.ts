import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { bookings, sessions } from '../../src/adapters/db/schema';
import { DrizzleVoucherRepository } from '../../src/adapters/db/drizzle-voucher.repository';
import { DrizzleBankRepository } from '../../src/adapters/db/drizzle-bank.repository';
import { DrizzleGdprRepository } from '../../src/adapters/db/drizzle-gdpr.repository';
import { required } from '../../src/adapters/db/transaction';
import { PAYMENT_MODES } from '../../src/config/constants';
it.each(['PENDING_PAYMENT', 'PROOF_SUBMITTED'] as const)(
  'cancels an unpaid %s booking idempotently without inventing a voucher',
  async (status) => {
    const context = await fixture(PAYMENT_MODES.BANK_TRANSFER);
    const booked = required(await reserve(rawInput(context)));
    await db.update(bookings).set({ status }).where(eq(bookings.id, booked.bookingId));
    const input = {
      organizationId: context.organizationId,
      bookingId: booked.bookingId,
      version: 0,
      adminOverride: false,
      code: 'RPT-2345-6789',
      now: new Date(),
    };
    const repo = new DrizzleVoucherRepository(db);
    const result = required(await repo.cancelBookingAtomically(input));
    expect(result.voucherIssued).toBe(false);
    expect(required(await repo.cancelBookingAtomically(input)).bookingCancelled).toBe(true);
    const [booking] = await db.select().from(bookings);
    expect(booking?.status).toBe('CANCELLED_BY_ATTENDEE');
    expect(booking?.lockedUntil).toBeNull();
  },
);
it('rejects a participant proof upload after the session started even if the 48h hold is unexpired', async () => {
  const context = await fixture(PAYMENT_MODES.BANK_TRANSFER);
  const booked = required(await reserve(rawInput(context)));
  await db
    .update(sessions)
    .set({ startsAt: new Date(Date.now() - 3600000) })
    .where(eq(sessions.id, booked.sessionId));
  const input = {
    organizationId: context.organizationId,
    bookingId: booked.bookingId,
    version: 0,
    now: new Date(),
  };
  const repo = new DrizzleBankRepository(db);
  expect((await repo.scheduleUploadCleanup({ ...input, storageKey: 'late.png' })).ok).toBe(false);
  expect(
    (await repo.attachProofToBookingAtomically({ ...input, proofStorageKey: 'late.png' })).ok,
  ).toBe(false);
});
it('anonymizes an abandoned unpaid proof submission older than twelve months', async () => {
  const context = await fixture(PAYMENT_MODES.BANK_TRANSFER);
  const booked = required(await reserve(rawInput(context)));
  await db
    .update(bookings)
    .set({
      status: 'PROOF_SUBMITTED',
      lockedUntil: new Date('2023-01-03Z'),
      createdAt: new Date('2023-01-01Z'),
    })
    .where(eq(bookings.id, booked.bookingId));
  const result = required(
    await new DrizzleGdprRepository(db).anonymizeUnpaidBookingsOlderThanAtomically(
      new Date('2025-01-01Z'),
    ),
  );
  expect(result.anonymizedCount).toBe(1);
  const [booking] = await db.select().from(bookings);
  expect(booking?.email).toBe('anonymous@invalid.local');
});

it('releases the original voucher when an unpaid supplement is cancelled without creating extra credit', async () => {
  const { issuedVoucher, changePrice } = await import('./lifecycle-fixtures');
  const { rescheduleVouchers } = await import('../../src/adapters/db/schema');
  const input = await issuedVoucher(2000);
  const context = await changePrice(input.context, 3000);
  const pending = required(
    await reserve({ ...rawInput(context), voucherCode: input.voucher.code }),
  );
  const result = required(
    await new DrizzleVoucherRepository(db).cancelBookingAtomically({
      organizationId: context.organizationId,
      bookingId: pending.bookingId,
      version: 0,
      adminOverride: false,
      code: 'RPT-2345-6789',
      now: new Date(),
    }),
  );
  expect(result.voucherIssued).toBe(false);
  const vouchers = await db.select().from(rescheduleVouchers);
  expect(vouchers).toHaveLength(1);
  expect(vouchers[0]?.status).toBe('ACTIVE');
  expect(vouchers[0]?.lockedBookingId).toBeNull();
});
