import { it, expect } from 'vitest';
import {
  parseBookingInput,
  validateBookingInputWithPolicy,
} from '../../src/core/domain/booking-validation';
import { localDayAndTimeToUtc } from '../../src/core/domain/timezone';
import { AUDIENCE_POLICIES, ERROR_CODES } from '../../src/config/constants';
const input = {
  organizationId: '11111111-1111-4111-8111-111111111111',
  activityId: '22222222-2222-4222-8222-222222222222',
  startsAtIso: '2026-11-11T13:00:00Z',
  idempotencyKey: 'request-test',
  firstName: 'Marie',
  lastName: 'Test',
  email: 'audit@example.com',
  phone: '--------',
  acceptedTerms: true,
  acceptedAgeAttestation: true,
  acceptedTermsVersionHash: 'a'.repeat(64),
};
it('rejects punctuation as a required emergency phone', () => {
  const result = validateBookingInputWithPolicy(input, {
    audiencePolicy: AUDIENCE_POLICIES.MINORS_ONLY,
    requirePhone: false,
    expectedTermsVersionHash: input.acceptedTermsVersionHash,
  });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.code).toBe(ERROR_CODES.MINOR_EMERGENCY_PHONE_REQUIRED);
});
it('normalizes an absent phone to null', () => {
  const result = parseBookingInput({ ...input, phone: undefined });
  expect(result.ok && result.value.phone).toBeNull();
});
it('rejects cyclic or malformed input without throwing', () => {
  const cyclic: Record<string, unknown> = {};
  cyclic['self'] = cyclic;
  expect(parseBookingInput(cyclic).ok).toBe(false);
});
it('rejects nonexistent and ambiguous Brussels local times', () => {
  expect(localDayAndTimeToUtc(2026, 2, 29, '02:30', 'Europe/Brussels').ok).toBe(false);
  expect(localDayAndTimeToUtc(2026, 9, 25, '02:30', 'Europe/Brussels').ok).toBe(false);
});
it('rejects an invalid timezone with Result', () => {
  expect(localDayAndTimeToUtc(2026, 10, 11, '14:00', 'bad/zone').ok).toBe(false);
});
it('converts ordinary Brussels time to UTC', () => {
  const result = localDayAndTimeToUtc(2026, 10, 11, '14:00', 'Europe/Brussels');
  expect(result.ok && result.value.toISOString()).toBe('2026-11-11T13:00:00.000Z');
});
