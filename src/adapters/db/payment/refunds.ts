import { eq } from 'drizzle-orm';
import { bookings } from '../schema';
import type { Transaction } from '../transaction';
import type { BookingRow } from '../reservation/context';
import { enqueue } from '../jobs/enqueue';
import { JOB_TYPES, PAYMENT_MODES, PAYMENT_RULES, TIME } from '../../../config/constants';
export async function queueRefund(
  tx: Transaction,
  booking: BookingRow,
  reference: string,
  amount: number,
  key: string,
): Promise<void> {
  if (amount <= 0) return;
  await enqueue(tx, booking.organizationId, JOB_TYPES.REFUND, key, {
    bookingId: booking.id,
    paymentReference: reference,
    amountCents: amount,
    merchantAccountId: booking.merchantAccountId,
    idempotencyKey: key,
  });
}
export async function queueBookingRefund(
  tx: Transaction,
  booking: BookingRow,
  now: Date,
): Promise<void> {
  if (booking.amountPaidCents <= 0) return;
  const deadline = new Date(
    now.getTime() + PAYMENT_RULES.ORGANIZER_REFUND_DEADLINE_DAYS * TIME.DAY_MS,
  );
  await tx
    .update(bookings)
    .set({
      refundStatus: booking.paymentMode === PAYMENT_MODES.STRIPE ? 'PENDING' : 'MANUAL_PENDING',
      refundDeadline: deadline,
    })
    .where(eq(bookings.id, booking.id));
  if (booking.paymentMode === PAYMENT_MODES.STRIPE && booking.paymentReference)
    await queueRefund(
      tx,
      booking,
      booking.paymentReference,
      booking.amountPaidCents,
      `refund:${booking.paymentReference}`,
    );
}
