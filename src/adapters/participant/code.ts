import { createHmac, timingSafeEqual } from 'node:crypto';
import type { BookingCredential } from '../../core/ports/participant-access.port';
import { PARTICIPANT } from '../../config/constants';
import { ParticipantCodeSchema } from '../../core/validation/participant';
export function participantCode(row: BookingCredential, secret: string, test = false) {
  const prefix = test ? PARTICIPANT.TEST_PREFIX : PARTICIPANT.CODE_PREFIX;
  const signature = createHmac('sha256', secret)
    .update(
      [
        PARTICIPANT.CODE_CONTEXT,
        prefix,
        row.id,
        row.organizationId,
        row.bookingId,
        row.version,
      ].join(':'),
    )
    .digest()
    .subarray(0, PARTICIPANT.SIGNATURE_BYTES)
    .toString('hex')
    .toUpperCase();
  return `${prefix}-${row.id.replaceAll('-', '').toUpperCase()}-${signature}`;
}
export function participantCredentialId(code: string): string | null {
  const parsed = ParticipantCodeSchema.safeParse(code);
  if (!parsed.success) return null;
  const hex = parsed.data.split('-')[1];
  return hex
    ? hex.toLowerCase().replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, '$1-$2-$3-$4-$5')
    : null;
}
export function matchesParticipantCode(
  code: string,
  row: BookingCredential,
  secret: string,
  test = false,
) {
  const expected = Buffer.from(participantCode(row, secret, test));
  const received = Buffer.from(code);
  return expected.length === received.length && timingSafeEqual(expected, received);
}
