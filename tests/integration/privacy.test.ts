import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { paidBooking } from './lifecycle-fixtures';
import { bookings } from '../../src/adapters/db/schema';
import { DrizzleGdprRepository } from '../../src/adapters/db/drizzle-gdpr.repository';
import { GdprRetentionUseCase } from '../../src/core/use-cases/gdpr-retention.use-case';
import { required } from '../../src/adapters/db/transaction';
import { ok } from '../../src/lib/result';
it('erases non-accounting contact data while retaining the financial record', async () => {
  const input = await paidBooking();
  await db
    .update(bookings)
    .set({ phone: '+32470123456', marketingOptIn: true })
    .where(eq(bookings.id, input.booking.bookingId));
  const useCase = new GdprRetentionUseCase({
    gdprRepo: new DrizzleGdprRepository(db),
    authorization: {
      async authorizeOrganizationAdmin() {
        return ok(undefined);
      },
    },
  });
  const result = required(
    await useCase.handleAttendeePrivacyErasureRequest({
      organizationId: input.context.organizationId,
      bookingId: input.booking.bookingId,
    }),
  );
  expect(result.status).toBe('ACCOUNTING_DATA_RETAINED');
  const [booking] = await db.select().from(bookings);
  expect(booking?.phone).toBeNull();
  expect(booking?.marketingOptIn).toBe(false);
  expect(booking?.amountPaidCents).toBe(3000);
  expect(booking?.selfServiceVersion).toBe(1);
});
it('rechecks payment before allowing full erasure inside the transaction', async () => {
  const input = await paidBooking();
  const result = await new DrizzleGdprRepository(db).fullyAnonymizeBookingAtomically(
    input.context.organizationId,
    input.booking.bookingId,
  );
  expect(result.ok).toBe(false);
  const [booking] = await db.select().from(bookings);
  expect(booking?.firstName).toBe('Test');
});
it('fully anonymizes an unpaid expired old reservation in the scheduled task', async () => {
  const context = await fixture();
  const booking = required(await reserve(rawInput(context)));
  await db
    .update(bookings)
    .set({ status: 'EXPIRED', lockedUntil: null, createdAt: new Date('2023-01-01T00:00:00Z') })
    .where(eq(bookings.id, booking.bookingId));
  const result = required(
    await new DrizzleGdprRepository(db).anonymizeUnpaidBookingsOlderThanAtomically(
      new Date('2025-01-01T00:00:00Z'),
    ),
  );
  expect(result.anonymizedCount).toBe(1);
  const [erased] = await db.select().from(bookings);
  expect(erased?.firstName).toBe('[anonymous]');
  expect(erased?.anonymizedAt).not.toBeNull();
});
