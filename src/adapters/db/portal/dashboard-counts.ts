import { eq, sql } from 'drizzle-orm';
import type { Executor } from '../transaction';
import { bookings } from '../schema';
import { bookingStatusFilter } from './booking-status-filter';
import { DASHBOARD } from '../../../config/dashboard';
export async function dashboardCounts(db: Executor, id: string) {
  const active = bookingStatusFilter(DASHBOARD.UPCOMING_STATUS);
  const proof = bookingStatusFilter('PROOF_SUBMITTED');
  const refunds = bookingStatusFilter(DASHBOARD.REFUND_STATUS);
  const [counts] = await db
    .select({
      bookingCount: sql<number>`count(*) FILTER(WHERE ${active})::int`,
      historicalBookingCount: sql<number>`count(*)::int`,
      inactiveBookingCount: sql<number>`count(*) FILTER(WHERE ${bookings.status} IN ('CANCELLED_BY_ATTENDEE','CANCELLED_BY_ORGANIZER','EXPIRED') OR (${bookings.status} IN ('PENDING_PAYMENT','PROOF_SUBMITTED') AND ${bookings.lockedUntil}<=now()))::int`,
      pendingProofCount: sql<number>`count(*) FILTER(WHERE ${proof})::int`,
      pendingRefundCount: sql<number>`count(*) FILTER(WHERE ${refunds})::int`,
    })
    .from(bookings)
    .where(eq(bookings.organizationId, id));
  return (
    counts ?? {
      bookingCount: 0,
      historicalBookingCount: 0,
      inactiveBookingCount: 0,
      pendingProofCount: 0,
      pendingRefundCount: 0,
    }
  );
}
