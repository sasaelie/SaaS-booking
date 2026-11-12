import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { bookings } from '../schema';
export function bookingStatusFilter(status: string) {
  switch (status) {
    case 'UPCOMING':
      return and(
        isNull(bookings.anonymizedAt),
        sql`(${bookings.status}='CONFIRMED' OR (${bookings.status} IN ('PENDING_PAYMENT','PROOF_SUBMITTED') AND ${bookings.lockedUntil}>now()))`,
        sql`EXISTS(SELECT 1 FROM sessions s WHERE s.id=${bookings.sessionId} AND s.organization_id=${bookings.organizationId} AND NOT s.is_cancelled AND s.starts_at>now())`,
      );
    case 'REFUND_PENDING':
      return sql`${bookings.refundStatus} IN ('PENDING','MANUAL_PENDING')`;
    case 'PROOF_SUBMITTED':
      return and(
        eq(bookings.status, 'PROOF_SUBMITTED'),
        isNull(bookings.anonymizedAt),
        sql`${bookings.lockedUntil}>now()`,
      );
    case 'PAYMENT_RECEIVED':
      return and(
        eq(bookings.status, 'CONFIRMED'),
        gt(bookings.amountPaidCents, 0),
        sql`${bookings.amountPaidCents}+${bookings.voucherDiscountCents}>=${bookings.unitPriceCents}`,
      );
    case 'PAYMENT_COVERED':
      return and(
        eq(bookings.status, 'CONFIRMED'),
        gt(bookings.unitPriceCents, 0),
        sql`${bookings.voucherDiscountCents}>=${bookings.unitPriceCents}`,
      );
    case 'PAYMENT_DUE':
      return and(
        sql`${bookings.status} IN ('CONFIRMED','PENDING_PAYMENT','PROOF_SUBMITTED')`,
        sql`${bookings.amountPaidCents}+${bookings.voucherDiscountCents}<${bookings.unitPriceCents}`,
        sql`(${bookings.lockedUntil} IS NULL OR ${bookings.lockedUntil}>now())`,
      );
    case 'PAYMENT_EXPIRED':
      return sql`(${bookings.status}='EXPIRED' OR (${bookings.status} IN ('PENDING_PAYMENT','PROOF_SUBMITTED') AND ${bookings.lockedUntil}<=now()))`;
    default:
      return status ? eq(bookings.status, status as typeof bookings.$inferSelect.status) : undefined;
  }
}
