import { expect, it } from 'vitest';
import { canIssueManualVoucher } from '../../src/core/domain/manual-voucher-eligibility';
const paidCancellation = {
  status: 'CANCELLED_BY_ATTENDEE',
  confirmedAt: new Date(),
  refundStatus: null,
  anonymizedAt: null,
  amountPaidCents: 2500,
  voucherDiscountCents: 0,
  appliedVoucherId: null,
};
it('allows an exceptional credit for a previously confirmed paid cancellation', () => {
  expect(canIssueManualVoucher(paidCancellation, null)).toBe(true);
});
it.each([
  { confirmedAt: null },
  { status: 'CONFIRMED' },
  { refundStatus: 'REFUNDED' },
  { anonymizedAt: new Date() },
  { amountPaidCents: 0 },
])('rejects ineligible cancellations: %j', (override) => {
  expect(canIssueManualVoucher({ ...paidCancellation, ...override }, null)).toBe(false);
});
it.each(['ACTIVE', 'LOCKED_PENDING_PAYMENT', 'EXPIRED', null])(
  'does not grant another credit for an unconsumed source code: %s',
  (status) => {
    const booking = {
      ...paidCancellation,
      appliedVoucherId: 'original',
      voucherDiscountCents: 500,
    };
    expect(canIssueManualVoucher(booking, status)).toBe(false);
  },
);
it('permits a confirmed reservation covered by a consumed code', () => {
  const booking = {
    ...paidCancellation,
    appliedVoucherId: 'original',
    voucherDiscountCents: 2500,
    amountPaidCents: 0,
  };
  expect(canIssueManualVoucher(booking, 'USED_FOR_BOOKING')).toBe(true);
});
