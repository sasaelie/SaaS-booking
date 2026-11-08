import { expect, it } from 'vitest';
import { ok, err } from '../../src/lib/result';
import { formatStructuredLog } from '../../src/lib/logger';
import { generateStructuredCommunication } from '../../src/lib/modulo97';
import { calculateSeatAvailability } from '../../src/core/domain/seat-calculator';
import { BOOKING_STATUSES } from '../../src/config/constants';
it('uses discriminated Result values', () => {
  expect(ok(3)).toEqual({ ok: true, value: 3 });
  expect(err('error')).toEqual({ ok: false, error: 'error' });
});
it('redacts values and preserves single-line structured logs', () => {
  expect(
    formatStructuredLog({
      module: 'Booking',
      fn: 'reserve',
      cause: 'invalid',
      received: 'person@example.com\nforged',
      expected: 'valid',
    }),
  ).toBe('[Booking :: reserve] invalid | reçu: [redacted] | attendu: valid');
});
it('computes Belgian structured communication including zero remainder', () => {
  expect(generateStructuredCommunication(1234567890)).toEqual(ok('+++123/4567/89002+++'));
  expect(generateStructuredCommunication(97)).toEqual(ok('+++000/0000/09797+++'));
  expect(generateStructuredCommunication(-5).ok).toBe(false);
});
it('releases a held seat exactly at expiry and counts confirmed seats', () => {
  const now = new Date('2026-11-09T10:00:00Z');
  const result = calculateSeatAvailability(
    5,
    [
      { id: 'a', sessionId: 's', status: BOOKING_STATUSES.CONFIRMED, lockedUntil: null },
      { id: 'b', sessionId: 's', status: BOOKING_STATUSES.PENDING_PAYMENT, lockedUntil: now },
      {
        id: 'c',
        sessionId: 's',
        status: BOOKING_STATUSES.PROOF_SUBMITTED,
        lockedUntil: new Date(now.getTime() + 1),
      },
    ],
    now,
  );
  expect(result.ok && result.value.displayLabel).toBe('3 / 5');
});
