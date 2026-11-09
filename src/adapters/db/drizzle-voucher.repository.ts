import { and, eq } from 'drizzle-orm';
import { bookings, rescheduleVouchers, activities } from './schema';
import { atomic, required, type Transaction } from './transaction';
import type { DrizzlePgDb } from './client';
import { lockBookingContext } from './payment/locks';
import { existingVoucher } from './vouchers/issue';
import { attendeeCancellationEffects, canCancelAttendee } from './vouchers/attendee-effects';
import { verifyVoucherIsUsable } from '../../core/domain/voucher-engine';
import type {
  VoucherRepositoryPort,
  CancellationInput,
  CancelByAttendeeOutput,
} from '../../core/ports/voucher.port';
import { ok, type Result } from '../../lib/result';
import { failure } from '../../lib/errors';
import { BOOKING_STATUSES, ERROR_CODES, VOUCHER_STATUSES } from '../../config/constants';
async function cancel(
  tx: Transaction,
  input: CancellationInput,
): Promise<Result<CancelByAttendeeOutput>> {
  const context = await lockBookingContext(tx, input.organizationId, input.bookingId);
  if (!context) return failure(ERROR_CODES.NOT_FOUND, 'Voucher', 'cancel');
  const { booking } = context;
  if (input.version !== null && booking.selfServiceVersion !== input.version)
    return failure(ERROR_CODES.UNAUTHORIZED, 'Voucher', 'cancel');
  if (booking.status === BOOKING_STATUSES.CANCELLED_BY_ATTENDEE) {
    const voucher = await existingVoucher(tx, input.organizationId, booking.id);
    return ok({
      bookingCancelled: true,
      voucherIssued: Boolean(voucher),
      voucher: voucher ?? null,
    });
  }
  if (!canCancelAttendee(context, input)) return failure(ERROR_CODES.CONFLICT, 'Voucher', 'cancel');
  const voucher = await attendeeCancellationEffects(tx, context, input);
  await tx
    .update(bookings)
    .set({
      status: BOOKING_STATUSES.CANCELLED_BY_ATTENDEE,
      cancelledAt: input.now,
      lockedUntil: null,
    })
    .where(eq(bookings.id, booking.id));
  return ok({
    bookingCancelled: true,
    voucherIssued: Boolean(voucher),
    voucher,
  });
}
export class DrizzleVoucherRepository implements VoucherRepositoryPort {
  constructor(private readonly db: DrizzlePgDb) {}
  cancelBookingAtomically(input: CancellationInput): Promise<Result<CancelByAttendeeOutput>> {
    return atomic(this.db, 'Voucher', (tx) => cancel(tx, input));
  }
  redeemVoucherForExternalBenefitAtomically(
    input: Parameters<VoucherRepositoryPort['redeemVoucherForExternalBenefitAtomically']>[0],
  ) {
    return atomic(this.db, 'Voucher', async (tx) => {
      const [voucher] = await tx
        .select()
        .from(rescheduleVouchers)
        .where(
          and(
            eq(rescheduleVouchers.organizationId, input.organizationId),
            eq(rescheduleVouchers.code, input.code),
          ),
        )
        .for('update');
      if (!voucher) return failure(ERROR_CODES.VOUCHER_INVALID_OR_EXPIRED, 'Voucher', 'external');
      required(verifyVoucherIsUsable(voucher, input.organizationId, input.now));
      const [activity] = await tx
        .select()
        .from(activities)
        .where(
          and(
            eq(activities.id, voucher.originActivityId),
            eq(activities.organizationId, input.organizationId),
          ),
        );
      if (!activity?.allowExternalBenefitExchange)
        return failure(ERROR_CODES.UNAUTHORIZED, 'Voucher', 'external');
      const [updated] = await tx
        .update(rescheduleVouchers)
        .set({
          status: VOUCHER_STATUSES.USED_FOR_EXTERNAL_BENEFIT,
          lockedUntil: null,
          lockedBookingId: null,
          usedAt: input.now,
        })
        .where(eq(rescheduleVouchers.id, voucher.id))
        .returning();
      return updated ? ok(updated) : failure(ERROR_CODES.INTERNAL_ERROR, 'Voucher', 'external');
    });
  }
}
