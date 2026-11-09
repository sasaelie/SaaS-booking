import { and, eq, sql } from 'drizzle-orm';
import { bookings, rescheduleVouchers } from '../schema';
import type { Transaction } from '../transaction';
import { newVoucherCode } from './code';
import { JOB_TYPES } from '../../../config/constants';
import { enqueue } from '../jobs/enqueue';
export async function issueRemainder(tx: Transaction, bookingId: string, organizationId: string) {
  const [booking] = await tx
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.organizationId, organizationId)));
  if (!booking?.appliedVoucherId || booking.status !== 'CONFIRMED') return;
  const source = await lockedSource(tx, booking.appliedVoucherId, organizationId);
  if (!source || source.status !== 'USED_FOR_BOOKING') return;
  const value = source.initialValueCents - booking.voucherDiscountCents;
  if (value <= 0) return;
  const code = newVoucherCode();
  const [voucher] = await tx
    .insert(rescheduleVouchers)
    .values({
      organizationId,
      originBookingId: booking.id,
      originActivityId: booking.activityId,
      kind: 'REMAINDER',
      sourceVoucherId: source.id,
      code,
      initialValueCents: value,
      currency: source.currency,
      expiresAt: source.expiresAt,
    })
    .onConflictDoNothing({
      target: rescheduleVouchers.sourceVoucherId,
      where: sql`${rescheduleVouchers.kind}='REMAINDER'`,
    })
    .returning();
  if (voucher)
    await enqueue(tx, organizationId, JOB_TYPES.VOUCHER, `voucher:${voucher.id}`, {
      voucherId: voucher.id,
    });
}

async function lockedSource(tx: Transaction, id: string, organizationId: string) {
  const [source] = await tx
    .select()
    .from(rescheduleVouchers)
    .where(
      and(eq(rescheduleVouchers.id, id), eq(rescheduleVouchers.organizationId, organizationId)),
    )
    .for('update');
  return source;
}
