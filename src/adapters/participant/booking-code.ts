import { sql } from 'drizzle-orm';
import type { Executor } from '../db/transaction';
import { rows } from '../db/transaction';
import type { BookingCredential } from '../../core/ports/participant-access.port';
import { participantCode } from './code';
import { participantAccessPredicate } from '../db/participant/access';
export async function bookingParticipantCode(
  db: Executor,
  organizationId: string,
  bookingId: string,
  secret: string,
) {
  const [credential] = await rows<BookingCredential & Record<string, unknown>>(
    db,
    sql`
    SELECT c.id,c.organization_id AS "organizationId",c.booking_id AS "bookingId",c.version
    FROM booking_access_credentials c JOIN bookings b ON b.id=c.booking_id AND b.organization_id=c.organization_id
    JOIN sessions s ON s.id=b.session_id AND s.organization_id=b.organization_id
    WHERE c.organization_id=${organizationId} AND c.booking_id=${bookingId}
      AND b.anonymized_at IS NULL AND ${participantAccessPredicate(new Date())}`,
  );
  return credential ? participantCode(credential, secret) : null;
}
