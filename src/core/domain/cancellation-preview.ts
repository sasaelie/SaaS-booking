import type { SelfBookingSnapshot } from '../ports/self-booking.port';
import type { CancellationPreview } from '../validation/cancellation-preview';
import { computeVoucherExpiryDate, evaluateCancellationEligibility } from './voucher-engine';
import { DEFAULTS, VOUCHER_RULES } from '../../config/constants';
export function previewCancellation(
  booking: SelfBookingSnapshot,
  now: Date,
): CancellationPreview | null {
  const value =
    booking.status === 'CONFIRMED'
      ? (booking.amountPaidCents ?? 0) + (booking.voucherDiscountCents ?? 0)
      : 0;
  const eligibility = evaluateCancellationEligibility({
    sessionStartsAt: booking.startsAt,
    cancelledAt: now,
    amountPaidCents: value,
    noticeHoursRequired: booking.noticeHoursForVoucher ?? 0,
    adminOverride: false,
  });
  if (!eligibility.ok) return null;
  return {
    eligible: eligibility.value.eligibleForVoucher,
    valueCents: eligibility.value.voucherValueCents,
    expiresAt: eligibility.value.eligibleForVoucher
      ? computeVoucherExpiryDate(
          now,
          booking.voucherValidityMonths ?? VOUCHER_RULES.DEFAULT_VALIDITY_MONTHS,
        ).toISOString()
      : null,
    currency: booking.currency ?? DEFAULTS.CURRENCY,
    paidValueCents: value,
  };
}
