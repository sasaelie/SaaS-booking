import { and, eq } from 'drizzle-orm';
import { rescheduleVouchers } from '../schema';
import { required, type Transaction } from '../transaction';
import type { LockedBooking } from '../payment/locks';
import { readActivity } from '../activity-reader';
import {
  evaluateCancellationEligibility,
  computeVoucherExpiryDate,
} from '../../../core/domain/voucher-engine';
import type { CancellationInput } from '../../../core/ports/voucher.port';
import { enqueue } from '../jobs/enqueue';
import { JOB_TYPES } from '../../../config/constants';
export async function existingVoucher(tx: Transaction, organizationId: string, bookingId: string) {
  const [voucher] = await tx
    .select()
    .from(rescheduleVouchers)
    .where(
      and(
        eq(rescheduleVouchers.organizationId, organizationId),
        eq(rescheduleVouchers.originBookingId, bookingId),
      ),
    );
  return voucher;
}
export async function issueCancellationVoucher(
  tx: Transaction,
  context: LockedBooking,
  input: CancellationInput,
) {
  const { booking, session } = context;
  const activity = required(await readActivity(tx, booking.organizationId, booking.activityId));
  const value = booking.amountPaidCents + booking.voucherDiscountCents;
  const eligibility = required(
    evaluateCancellationEligibility({
      sessionStartsAt: session.startsAt,
      cancelledAt: input.now,
      noticeHoursRequired: activity.noticeHoursForVoucher,
      amountPaidCents: value,
      adminOverride: input.adminOverride,
    }),
  );
  if (!eligibility.eligibleForVoucher) return null;
  const [voucher] = await tx
    .insert(rescheduleVouchers)
    .values({
      organizationId: booking.organizationId,
      originActivityId: booking.activityId,
      originBookingId: booking.id,
      code: input.code,
      initialValueCents: eligibility.voucherValueCents,
      currency: booking.currency,
      expiresAt: computeVoucherExpiryDate(input.now, activity.voucherValidityMonths),
    })
    .returning();
  if (!voucher) throw Error('Voucher insertion failed');
  await enqueue(tx, booking.organizationId, JOB_TYPES.VOUCHER, `voucher:${voucher.id}`, {
    voucherId: voucher.id,
  });
  return voucher;
}
