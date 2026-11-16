import { sql } from 'drizzle-orm';
import type { Executor } from '../transaction';
import { rows } from '../transaction';
import type { BookingCredential } from '../../../core/ports/participant-access.port';
import { matchesParticipantCode, participantCredentialId } from '../../participant/code';
import { participantAccessPredicate } from './access';
import { ParticipantCodeSchema } from '../../../core/validation/participant';
export async function readCredential(
  db: Executor,
  code: string,
  secret: string,
  test: boolean,
  now: Date,
) {
  const parsed = ParticipantCodeSchema.safeParse(code);
  const id = parsed.success ? participantCredentialId(parsed.data) : null;
  if (!id || !parsed.success) return null;
  const [row] = await rows<BookingCredential & Record<string, unknown>>(
    db,
    sql`
    SELECT c.id,c.organization_id AS "organizationId",c.booking_id AS "bookingId",c.version
    FROM booking_access_credentials c
    JOIN bookings b ON b.id=c.booking_id AND b.organization_id=c.organization_id
    JOIN sessions s ON s.id=b.session_id AND s.organization_id=b.organization_id
    WHERE c.id=${id} AND b.anonymized_at IS NULL AND ${participantAccessPredicate(now)}`,
  );
  return row && matchesParticipantCode(parsed.data, row, secret, test) ? row : null;
}
