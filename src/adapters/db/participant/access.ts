import { sql } from 'drizzle-orm';
import type { Executor } from '../transaction';
import { rows } from '../transaction';
import type { SelfCancelTokenPayload } from '../../../core/validation/self-service';
// Used by legacy links AND participant sessions; browser identifiers never authorize a row.
export function participantAccessPredicate(now: Date) {
  return sql`NOT EXISTS (SELECT 1 FROM booking_access_credentials c
    WHERE c.organization_id=b.organization_id AND c.booking_id=b.id AND
      (c.revoked_at IS NOT NULL OR c.closed_at IS NOT NULL OR c.version<>b.self_service_version))
    AND NOT (s.ends_at<=${now}
      AND EXISTS(SELECT 1 FROM reschedule_vouchers v WHERE v.organization_id=b.organization_id AND v.origin_booking_id=b.id AND v.status IN ('USED_FOR_BOOKING','USED_FOR_EXTERNAL_BENEFIT'))
      AND NOT EXISTS(SELECT 1 FROM reschedule_vouchers v WHERE v.organization_id=b.organization_id AND v.origin_booking_id=b.id AND v.status IN ('ACTIVE','LOCKED_PENDING_PAYMENT') AND v.expires_at>${now}))`;
}
export async function hasBookingAccess(db: Executor, payload: SelfCancelTokenPayload, now: Date) {
  const found = await rows(
    db,
    sql`SELECT b.id FROM bookings b
    JOIN sessions s ON s.id=b.session_id AND s.organization_id=b.organization_id
    WHERE b.id=${payload.bookingId} AND b.organization_id=${payload.organizationId}
      AND b.self_service_version=${payload.version} AND b.anonymized_at IS NULL
      AND ${participantAccessPredicate(now)}`,
  );
  return found.length > 0;
}
