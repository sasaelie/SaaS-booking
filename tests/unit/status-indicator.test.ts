import { expect, it } from 'vitest';
import { paymentIndicator, accessIndicator } from '../../src/core/domain/status-indicator';
const booking = {
  status: 'CONFIRMED' as const,
  unitPriceCents: 2500,
  amountPaidCents: 0,
  lockedUntil: null,
};
const access = {
  organizationId: 'test',
  complimentary: false,
  suspendedAt: null,
  status: 'ACTIVE',
  currentPeriodEnd: new Date('2027-01-02'),
  cancelAtPeriodEnd: false,
};
it('distinguishes confirmed on-site reservations from paid, free and fully credited reservations', () => {
  expect(paymentIndicator(booking).tone).toBe('orange');
  expect(paymentIndicator({ ...booking, amountPaidCents: 2500 }).label).toBe('Payé');
  expect(paymentIndicator({ ...booking, voucherDiscountCents: 2500 }).label).toBe(
    'Couvert par un code',
  );
  expect(paymentIndicator({ ...booking, unitPriceCents: 0 }).label).toBe('Gratuit');
  expect(paymentIndicator({ ...booking, status: 'CANCELLED_BY_ATTENDEE' }).tone).toBe('red');
});
it.each(['CANCELLED_BY_ATTENDEE', 'CANCELLED_BY_ORGANIZER', 'EXPIRED'] as const)(
  'marks ended bookings red: %s',
  (status) => {
    expect(paymentIndicator({ ...booking, status }).tone).toBe('red');
  },
);
it('keeps pending activation and overdue payment orange without mislabelling final termination', () => {
  const now = new Date('2027-01-01');
  expect(accessIndicator({ ...access, status: 'INACTIVE', currentPeriodEnd: null }, now).tone).toBe(
    'orange',
  );
  expect(accessIndicator({ ...access, status: 'PAST_DUE' }, now).tone).toBe('orange');
  expect(accessIndicator({ ...access, status: 'CANCELED', currentPeriodEnd: null }, now).tone).toBe(
    'red',
  );
});
it('does not downgrade a confirmed paid booking because of an obsolete payment hold', () => {
  expect(
    paymentIndicator({ ...booking, amountPaidCents: 2500, lockedUntil: new Date('2020-01-01') })
      .tone,
  ).toBe('green');
});
it('warns about actual approaching expiry while leaving automatic renewal green', () => {
  const now = new Date('2027-01-01');
  expect(accessIndicator(access, now).tone).toBe('green');
  expect(accessIndicator({ ...access, cancelAtPeriodEnd: true }, now).tone).toBe('orange');
  expect(accessIndicator({ ...access, currentPeriodEnd: new Date('2026-01-01') }, now).tone).toBe(
    'red',
  );
  expect(accessIndicator({ ...access, complimentary: true }, now).label).toBe('Accès offert');
});
