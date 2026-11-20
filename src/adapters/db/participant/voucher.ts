import { sql } from 'drizzle-orm';
import type { Executor } from '../transaction';
import { rows } from '../transaction';
import { readCredential } from './credential';
import { ok } from '../../../lib/result';
import { failure } from '../../../lib/errors';
import { ERROR_CODES } from '../../../config/constants';
export interface ParticipantCodeOptions {
  readonly secret: string;
  readonly test?: boolean;
  readonly skipNotifications?: boolean;
}
export async function resolveBookingVoucher(
  db: Executor,
  code: string | null,
  organizationId: string,
  now: Date,
  options?: ParticipantCodeOptions,
) {
  if (!code || (!code.startsWith('CLI-') && !code.startsWith('TEST-'))) return ok(code);
  const credential = options
    ? await readCredential(db, code, options.secret, options.test ?? false, now)
    : null;
  if (!credential || credential.organizationId !== organizationId)
    return failure(ERROR_CODES.VOUCHER_INVALID_OR_EXPIRED, 'Participant', 'voucher');
  const vouchers = await rows<{ code: string }>(
    db,
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
}
