import { randomBytes, createHash } from 'node:crypto';
import { sql } from 'drizzle-orm';
import type { ParticipantAccessPort } from '../../../core/ports/participant-access.port';
import type { SelfCancelTokenPayload } from '../../../core/validation/self-service';
import type { DrizzlePgDb } from '../client';
import { atomic, rows } from '../transaction';
import { PARTICIPANT, ERROR_CODES, TIME } from '../../../config/constants';
import { ok } from '../../../lib/result';
import { failure } from '../../../lib/errors';
import { readCredential } from './credential';
import { participantAccessPredicate, hasBookingAccess } from './access';
import { readParticipantTicket } from './ticket';
const digest = (value: string) => createHash('sha256').update(value).digest('hex');
const denied = () => failure(ERROR_CODES.UNAUTHORIZED, 'Participant', 'access');
export class ParticipantAccessRepository implements ParticipantAccessPort {
  constructor(
    private readonly db: DrizzlePgDb,
    private readonly secret: string,
    private readonly appUrl: string,
    private readonly test = false,
  ) {}
  authorizeCode(code: string, now: Date) {
    return atomic(this.db, 'Participant', async (tx) => {
      const row = await readCredential(tx, code, this.secret, this.test, now);
      return row
        ? ok({
            organizationId: row.organizationId,
            bookingId: row.bookingId,
            version: row.version,
            expUnixSeconds: Math.floor(now.getTime() / TIME.SECOND_MS) + PARTICIPANT.TOKEN_SECONDS,
          })
        : denied();
    });
  }
  exchange(code: string, browserToken: string | null, now: Date) {
    return atomic(this.db, 'Participant', async (tx) => {
      const credential = await readCredential(tx, code, this.secret, this.test, now);
      if (!credential || this.test) return denied();
      const token =
        browserToken && /^[a-f0-9]{64}$/.test(browserToken)
          ? browserToken
          : randomBytes(PARTICIPANT.SESSION_BYTES).toString('hex');
      const expires = new Date(now.getTime() + PARTICIPANT.SESSION_HOURS * TIME.HOUR_MS);
      await tx.execute(sql`INSERT INTO participant_booking_sessions
        (token_hash,organization_id,booking_id,credential_id,expires_at)
        VALUES(${digest(token)},${credential.organizationId},${credential.bookingId},${credential.id},${expires})
        ON CONFLICT(token_hash,booking_id,organization_id) DO UPDATE SET expires_at=excluded.expires_at,credential_id=excluded.credential_id`);
      await tx.execute(sql`INSERT INTO booking_access_events(organization_id,booking_id,action)
        VALUES(${credential.organizationId},${credential.bookingId},'CODE_EXCHANGED')`);
      await tx.execute(sql`DELETE FROM participant_booking_sessions WHERE expires_at<=${now}`);
      return ok({ browserToken: token, bookingId: credential.bookingId });
    });
  }
  authorize(browserToken: string, bookingId: string, now: Date) {
    return atomic(this.db, 'Participant', async (tx) => {
      if (!/^[a-f0-9]{64}$/.test(browserToken)) return denied();
      const [row] = await rows<{ organizationId: string; bookingId: string; version: number }>(
        tx,
        sql`
        SELECT b.organization_id AS "organizationId",b.id AS "bookingId",b.self_service_version AS version
        FROM participant_booking_sessions p
        JOIN bookings b ON b.id=p.booking_id AND b.organization_id=p.organization_id
        JOIN booking_access_credentials c ON c.id=p.credential_id AND c.booking_id=b.id AND c.organization_id=b.organization_id
        JOIN sessions s ON s.id=b.session_id AND s.organization_id=b.organization_id
        WHERE p.token_hash=${digest(browserToken)} AND p.booking_id=${bookingId} AND p.expires_at>${now}
          AND b.anonymized_at IS NULL AND ${participantAccessPredicate(now)}`,
      );
      return row
        ? ok({
            ...row,
            expUnixSeconds: Math.floor(now.getTime() / TIME.SECOND_MS) + PARTICIPANT.TOKEN_SECONDS,
          })
        : denied();
    });
  }
  ticket(payload: SelfCancelTokenPayload, now: Date) {
    return atomic(this.db, 'Participant', async (tx) => {
      if (!(await hasBookingAccess(tx, payload, now))) return denied();
      return ok(await readParticipantTicket(tx, payload, this.secret, this.appUrl, this.test, now));
    });
  }
  resolveVoucher(code: string, organizationId: string, now: Date) {
    return atomic(this.db, 'Participant', async (tx) => {
      const credential = await readCredential(tx, code, this.secret, this.test, now);
      if (!credential || credential.organizationId !== organizationId)
        return failure(ERROR_CODES.VOUCHER_INVALID_OR_EXPIRED, 'Participant', 'voucher');
      const vouchers = await rows<{ code: string }>(
        tx,
        sql`SELECT code FROM reschedule_vouchers
        WHERE origin_booking_id=${credential.bookingId} AND organization_id=${organizationId}
          AND status='ACTIVE' AND expires_at>${now} ORDER BY id`,
      );
      return vouchers.length === 1 && vouchers[0]
        ? ok(vouchers[0].code)
        : failure(
            vouchers.length > 1 ? ERROR_CODES.CONFLICT : ERROR_CODES.VOUCHER_INVALID_OR_EXPIRED,
            'Participant',
            'voucher',
          );
    });
  }
}
