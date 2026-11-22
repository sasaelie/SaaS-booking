import { expect, it } from 'vitest';
import {
  canKeepParticipantAccess,
  isAdmissionValid,
} from '../../src/core/domain/participant-access';
import { ParticipantCodeSchema } from '../../src/core/validation/participant';
const end = new Date('2026-01-01T12:00:00Z');
const after = new Date('2026-01-01T12:00:01Z');
it.each(['ACTIVE', 'LOCKED_PENDING_PAYMENT', 'EXPIRED'])('keeps past access for %s', (status) => {
  expect(canKeepParticipantAccess(end, [{ status }], after)).toBe(true);
});
it('keeps access without a voucher and keeps a 30-day recovery period after full closure', () => {
  expect(canKeepParticipantAccess(end, [], after)).toBe(true);
  expect(canKeepParticipantAccess(end, [{ status: 'USED_FOR_BOOKING' }], end)).toBe(true);
  expect(
    canKeepParticipantAccess(
      end,
      [{ status: 'USED_FOR_EXTERNAL_BENEFIT' }],
      new Date(end.getTime() - 1),
    ),
  ).toBe(true);
});
it('does not strand a second credit or a payment lock', () => {
  expect(
    canKeepParticipantAccess(end, [{ status: 'USED_FOR_BOOKING' }, { status: 'ACTIVE' }], after),
  ).toBe(true);
  expect(
    canKeepParticipantAccess(
      end,
      [{ status: 'USED_FOR_BOOKING' }, { status: 'LOCKED_PENDING_PAYMENT' }],
      after,
    ),
  ).toBe(true);
});
it('does not make a historical or cancelled ticket admit a participant', () => {
  expect(isAdmissionValid('CONFIRMED', false, end, after)).toBe(false);
  expect(isAdmissionValid('CANCELLED_BY_ATTENDEE', false, end, new Date(0))).toBe(false);
  expect(isAdmissionValid('CONFIRMED', false, end, new Date(0))).toBe(true);
});
it('does not prolong an old code because a separate, unused credit has already expired', () => {
  expect(
    canKeepParticipantAccess(
      end,
      [{ status: 'USED_FOR_BOOKING' }, { status: 'ACTIVE', expiresAt: new Date(0) }],
      new Date(end.getTime() + 30 * 86400000),
    ),
  ).toBe(false);
});
it('does not accept an old RPT report code as an access credential', () => {
  expect(ParticipantCodeSchema.safeParse('RPT-ABCD-EFGH').success).toBe(false);
});

it('closes at 30 days without credit and protects unresolved money or disputes', () => {
  const boundary = new Date(end.getTime() + 30 * 86400000);
  expect(canKeepParticipantAccess(end, [], new Date(boundary.getTime() - 1))).toBe(true);
  expect(canKeepParticipantAccess(end, [], boundary)).toBe(false);
  expect(canKeepParticipantAccess(end, [], boundary, true)).toBe(true);
  expect(canKeepParticipantAccess(end, [], boundary, false, after)).toBe(true);
});
