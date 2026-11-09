import { issueRemainder } from '../vouchers/remainder';
import { and, eq } from 'drizzle-orm';
import { bookings, rescheduleVouchers } from '../schema';
import type { Transaction } from '../transaction';
import type { LockedBooking } from './locks';
import { enqueue } from '../jobs/enqueue';
import { calculateSeatAvailability } from '../../../core/domain/seat-calculator';
import { required } from '../transaction';
import { BOOKING_STATUSES, VOUCHER_STATUSES, JOB_TYPES } from '../../../config/constants';
import type { ParsedWebhookPaymentEvent } from '../../../core/ports/payment-gateway.port';
export async function canConfirm(
  tx: Transaction,
  context: LockedBooking,
  now: Date,
): Promise<boolean> {
  const { booking, session, voucher } = context;
  if (
    booking.anonymizedAt ||
    session.isCancelled ||
    ![
      BOOKING_STATUSES.PENDING_PAYMENT,
      BOOKING_STATUSES.PROOF_SUBMITTED,
      BOOKING_STATUSES.EXPIRED,
    ].some((status) => status === booking.status)
  )
    return false;
  if (
    booking.appliedVoucherId &&
    (!voucher ||
      voucher.status !== VOUCHER_STATUSES.LOCKED_PENDING_PAYMENT ||
      voucher.lockedBookingId !== booking.id ||
      voucher.expiresAt <= now)
  )
    return false;
  const snapshots = await tx
    .select()
    .from(bookings)
    .where(
      and(eq(bookings.sessionId, session.id), eq(bookings.organizationId, booking.organizationId)),
    );
  return required(
    calculateSeatAvailability(
      session.capacity,
      snapshots.filter((row) => row.id !== booking.id),
      now,
    ),
  ).isBookable;
}
export async function confirmBooking(
  tx: Transaction,
  context: LockedBooking,
  event: ParsedWebhookPaymentEvent,
  now: Date,
): Promise<void> {
  const { booking, voucher } = context;
  await tx
    .update(bookings)
    .set({
      status: BOOKING_STATUSES.CONFIRMED,
      paymentReference: event.paymentReference,
      checkoutReference: event.checkoutReference,
      amountPaidCents: event.amountPaidCents,
      paidAt: now,
      confirmedAt: now,
      lockedUntil: null,
    })
    .where(eq(bookings.id, booking.id));
  if (voucher)
    await tx
      .update(rescheduleVouchers)
      .set({
        status: VOUCHER_STATUSES.USED_FOR_BOOKING,
        lockedBookingId: null,
        lockedUntil: null,
        usedAt: now,
      })
      .where(eq(rescheduleVouchers.id, voucher.id));
  await issueRemainder(tx, booking.id, booking.organizationId);
  await enqueue(tx, booking.organizationId, JOB_TYPES.CONFIRMATION, `confirmation:${booking.id}`, {
    bookingId: booking.id,
  });
}
