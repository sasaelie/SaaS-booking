import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { bookings } from '../../src/adapters/db/schema';
import { paidBooking } from './lifecycle-fixtures';
import { ownerOf } from './service-voucher-fixtures';
import { required } from '../../src/adapters/db/transaction';
it('projects actionable credit eligibility without exposing internal voucher metadata', async () => {
  const { context, booking } = await paidBooking();
  const owner = await ownerOf(context.organizationId);
  await db
    .update(bookings)
    .set({ status: 'CANCELLED_BY_ATTENDEE' })
    .where(eq(bookings.id, booking.bookingId));
  const list = () =>
    owner.repository.bookings(owner.actor, context.organizationId, {
      page: 1,
      search: '',
      status: '',
    });
  const before = required(await list()).bookings[0];
  expect(before?.canIssueVoucher).toBe(true);
  expect(before).not.toHaveProperty('confirmedAt');
  expect(before).not.toHaveProperty('appliedVoucherId');
  expect(before).not.toHaveProperty('sourceStatus');
  required(
    await owner.repository.issueManualVoucher(owner.actor, {
      organizationId: context.organizationId,
      bookingId: booking.bookingId,
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
      confirmed: true,
    }),
  );
  expect(required(await list()).bookings[0]?.canIssueVoucher).toBe(false);
});
it('hides credit actions for refunded and anonymized cancellations in the actual organizer list', async () => {
  const { context, booking } = await paidBooking();
  const owner = await ownerOf(context.organizationId);
  const list = () =>
    owner.repository.bookings(owner.actor, context.organizationId, {
      page: 1,
      search: '',
      status: '',
    });
  for (const state of [
    { status: 'CANCELLED_BY_ATTENDEE' as const, refundStatus: 'REFUNDED' as const },
    { status: 'CANCELLED_BY_ATTENDEE' as const, refundStatus: null, anonymizedAt: new Date() },
  ]) {
    await db.update(bookings).set(state).where(eq(bookings.id, booking.bookingId));
    expect(required(await list()).bookings[0]?.canIssueVoucher).toBe(false);
  }
});
