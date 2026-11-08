import { rescheduleVouchers } from '../schema';
import { required, type Transaction } from '../transaction';
import type { BookingRow } from '../reservation/context';
import { readActivity } from '../activity-reader';
import {
  generateFormattedVoucherCode,
  computeVoucherExpiryDate,
} from '../../../core/domain/voucher-engine';
import { INPUT_LIMITS, JOB_TYPES } from '../../../config/constants';
import { enqueue } from '../jobs/enqueue';
export async function restoreVoucherValue(
  tx: Transaction,
  booking: BookingRow,
  now: Date,
): Promise<void> {
  if (!booking.appliedVoucherId || booking.voucherDiscountCents <= 0) return;
  const activity = required(await readActivity(tx, booking.organizationId, booking.activityId));
  const code = required(
    generateFormattedVoucherCode(crypto.getRandomValues(new Uint8Array(INPUT_LIMITS.HASH_LENGTH))),
  );
  const [voucher] = await tx
    .insert(rescheduleVouchers)
    .values({
      organizationId: booking.organizationId,
      originActivityId: booking.activityId,
      originBookingId: booking.id,
      code,
      initialValueCents: booking.voucherDiscountCents,
      currency: booking.currency,
      expiresAt: computeVoucherExpiryDate(now, activity.voucherValidityMonths),
    })
    .returning();
  if (!voucher) throw Error('Voucher restoration failed');
  await enqueue(tx, booking.organizationId, JOB_TYPES.VOUCHER, `voucher:${voucher.id}`, {
    voucherId: voucher.id,
  });
}
