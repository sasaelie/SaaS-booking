import { and, eq } from 'drizzle-orm';
import { rescheduleVouchers } from '../schema';
import type { Transaction } from '../transaction';
import type { BookingRow } from '../reservation/context';
import { VOUCHER_STATUSES } from '../../../config/constants';
export async function releaseVoucher(tx: Transaction, booking: BookingRow): Promise<void> {
  if (!booking.appliedVoucherId) return;
  await tx
    .update(rescheduleVouchers)
    .set({
      status: VOUCHER_STATUSES.ACTIVE,
      lockedUntil: null,
      lockedBookingId: null,
      usedAt: null,
    })
    .where(
      and(
        eq(rescheduleVouchers.id, booking.appliedVoucherId),
        eq(rescheduleVouchers.organizationId, booking.organizationId),
        eq(rescheduleVouchers.lockedBookingId, booking.id),
      ),
    );
}
