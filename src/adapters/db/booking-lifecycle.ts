import { sql } from 'drizzle-orm';
import { COMMERCIAL } from '../../config/commercial';
import { TIME } from '../../config/constants';
// Both participant access and operational erasure use the same correlated booking/session policy.
export function bookingClosedAt() {
  return sql`GREATEST(s.ends_at,b.cancelled_at,b.paid_at,b.refund_updated_at,
    (SELECT max(COALESCE(v.used_at,v.expires_at)) FROM reschedule_vouchers v
      WHERE v.organization_id=b.organization_id AND v.origin_booking_id=b.id),
    (SELECT max(e.created_at) FROM financial_entries e
      WHERE e.organization_id=b.organization_id AND e.booking_id=b.id))`;
}
export function bookingOperationsOpen(now: Date) {
  const cutoff = new Date(now.getTime() - COMMERCIAL.OPERATIONAL_RETENTION_DAYS * TIME.DAY_MS);
  return sql`(b.legal_hold OR b.dispute_open OR ${bookingClosedAt()}>${cutoff}
    OR COALESCE(b.locked_until>${now},false) OR b.status='PROOF_SUBMITTED'
    OR (b.status='CONFIRMED' AND b.payment_mode='NONE' AND b.amount_paid_cents+b.voucher_discount_cents<b.unit_price_cents)
    OR COALESCE(b.refund_status,'') IN ('PENDING','MANUAL_PENDING','FAILED')
    OR EXISTS(SELECT 1 FROM reschedule_vouchers v WHERE v.organization_id=b.organization_id
      AND v.origin_booking_id=b.id AND v.status IN ('ACTIVE','LOCKED_PENDING_PAYMENT') AND v.expires_at>${now})
    OR EXISTS(SELECT 1 FROM outbox_jobs j WHERE j.organization_id=b.organization_id
      AND j.payload->>'bookingId'=b.id::text AND j.completed_at IS NULL
      AND j.type IN ('REFUND','FINANCIAL_RECONCILE')))`;
}
