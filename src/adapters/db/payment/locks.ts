import { and, eq, sql } from 'drizzle-orm';
import { bookings, sessions, rescheduleVouchers } from '../schema';
import { lockActivity } from '../activity-reader';
import type { Transaction } from '../transaction';
import { rows } from '../transaction';
export async function lockBookingContext(
  tx: Transaction,
  organizationId: string,
  bookingId: string,
) {
  const [initial] = await tx
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.organizationId, organizationId)));
  if (!initial) return null;
  await lockActivity(tx, organizationId, initial.activityId);
  if (initial.appliedVoucherId)
    await rows(
      tx,
      sql`SELECT id FROM reschedule_vouchers WHERE id=${initial.appliedVoucherId} AND organization_id=${organizationId} FOR UPDATE`,
    );
  const [session] = await tx
    .select()
    .from(sessions)
    .where(and(eq(sessions.id, initial.sessionId), eq(sessions.organizationId, organizationId)))
    .for('update');
  const [booking] = await tx
    .select()
    .from(bookings)
    .where(and(eq(bookings.id, bookingId), eq(bookings.organizationId, organizationId)))
    .for('update');
  if (!session || !booking) return null;
  const [voucher] = booking.appliedVoucherId
    ? await tx
        .select()
        .from(rescheduleVouchers)
        .where(
          and(
            eq(rescheduleVouchers.id, booking.appliedVoucherId),
            eq(rescheduleVouchers.organizationId, organizationId),
          ),
        )
    : [];
  return { booking, session, voucher };
}
export type LockedBooking = NonNullable<Awaited<ReturnType<typeof lockBookingContext>>>;
