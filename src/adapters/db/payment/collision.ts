import { eq } from 'drizzle-orm';
import { bookings } from '../schema';
import type { Transaction } from '../transaction';
import type { BookingRow } from '../reservation/context';
import type { ParsedWebhookPaymentEvent } from '../../../core/ports/payment-gateway.port';
import { queueRefund } from './refunds';
import { BOOKING_STATUSES } from '../../../config/constants';
import { recordFinancialPayment } from '../financial-ledger';
export async function queueCollision(
  tx: Transaction,
  booking: BookingRow,
  event: ParsedWebhookPaymentEvent,
  now: Date,
): Promise<void> {
  if (booking.status !== BOOKING_STATUSES.CONFIRMED)
    await tx
      .update(bookings)
      .set({
        status: BOOKING_STATUSES.CANCELLED_BY_ORGANIZER,
        cancelledAt: now,
        lockedUntil: null,
        paymentReference: event.paymentReference,
        checkoutReference: event.checkoutReference,
        amountPaidCents: event.amountPaidCents,
        paidAt: now,
        refundStatus: 'PENDING',
      })
      .where(eq(bookings.id, booking.id));
  if (booking.status !== BOOKING_STATUSES.CONFIRMED)
    await recordFinancialPayment(tx, booking.id, event.paymentReference, now);
  await queueRefund(
    tx,
    booking,
    event.paymentReference,
    event.amountPaidCents,
    `refund:${event.paymentReference}`,
  );
}
