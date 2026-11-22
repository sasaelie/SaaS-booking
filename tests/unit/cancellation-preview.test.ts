import { expect, it } from 'vitest';
import { previewCancellation } from '../../src/core/domain/cancellation-preview';
import type { SelfBookingSnapshot } from '../../src/core/ports/self-booking.port';
const now = new Date('2026-11-01T12:00:00Z');
const booking: SelfBookingSnapshot = {
  organizationName: 'Atelier',
  organizationSlug: 'atelier',
  activityId: crypto.randomUUID(),
  activityName: 'Couture',
  startsAt: new Date('2026-11-03T12:00:00Z'),
  timezone: 'Europe/Brussels',
  status: 'CONFIRMED',
  paymentMode: 'STRIPE',
  lockedUntil: null,
  hasProof: false,
  amountPaidCents: 1500,
  voucherDiscountCents: 1000,
  currency: 'EUR',
  noticeHoursForVoucher: 24,
  voucherValidityMonths: 3,
};
it('previews the paid amount plus existing credit using the agreed notice and expiry', () => {
  expect(previewCancellation(booking, now)).toMatchObject({
    eligible: true,
    valueCents: 2500,
    expiresAt: '2027-02-01T12:00:00.000Z',
  });
});
it('does not promise credit for unpaid, late or pending bookings', () => {
  expect(
    previewCancellation({ ...booking, amountPaidCents: 0, voucherDiscountCents: 0 }, now)
      ?.valueCents,
  ).toBe(0);
  expect(previewCancellation(booking, new Date('2026-11-03T00:00:01Z'))?.eligible).toBe(false);
  expect(previewCancellation({ ...booking, status: 'PENDING_PAYMENT' }, now)?.valueCents).toBe(0);
});
