import { restoreVoucherValue } from '../vouchers/restore';
import { eq } from 'drizzle-orm';
import { bookings } from '../schema';
import { releaseVoucher } from '../vouchers/release';
import { queueBookingRefund } from '../payment/refunds';
import { enqueue } from '../jobs/enqueue';
import type { Transaction } from '../transaction';
import type { BookingRow } from '../reservation/context';
import { BOOKING_STATUSES, JOB_TYPES } from '../../../config/constants';
export async function cancelByOrganizer(
  tx: Transaction,
  booking: BookingRow,
  reason: string,
  now: Date,
): Promise<void> {
  await tx
    .update(bookings)
    .set({
      status: BOOKING_STATUSES.CANCELLED_BY_ORGANIZER,
      cancelledAt: now,
      lockedUntil: null,
    })
    .where(eq(bookings.id, booking.id));
  await releaseVoucher(tx, booking);
  if (booking.status === BOOKING_STATUSES.CONFIRMED) await restoreVoucherValue(tx, booking, now);
  await queueBookingRefund(tx, booking, now);
  await enqueue(tx, booking.organizationId, JOB_TYPES.CANCELLATION, `cancellation:${booking.id}`, {
    bookingId: booking.id,
    reason,
  });
  if (booking.proofStorageKey)
    await enqueue(tx, booking.organizationId, JOB_TYPES.PURGE, `purge:${booking.proofStorageKey}`, {
      bookingId: booking.id,
      storageKey: booking.proofStorageKey,
    });
}
