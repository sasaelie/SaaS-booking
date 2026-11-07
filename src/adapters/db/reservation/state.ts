import { BOOKING_STATUSES, PAYMENT_MODES, PAYMENT_RULES, TIME } from '../../../config/constants';
import type { ActivityWithScheduleConfig } from '../../../core/ports/booking-ports';
import type { VoucherApplication } from './voucher';
export function initialState(
  activity: ActivityWithScheduleConfig,
  voucher: VoucherApplication,
  now: Date,
) {
  const paymentMode =
    voucher.id && voucher.remaining > 0 ? PAYMENT_MODES.STRIPE : activity.paymentMode;
  const confirmed = voucher.remaining === 0 || paymentMode === PAYMENT_MODES.NONE;
  const duration =
    paymentMode === PAYMENT_MODES.BANK_TRANSFER
      ? PAYMENT_RULES.BANK_TRANSFER_HOLD_HOURS * TIME.HOUR_MS
      : PAYMENT_RULES.STRIPE_HOLD_MINUTES * TIME.MINUTE_MS;
  return {
    paymentMode,
    status: confirmed ? BOOKING_STATUSES.CONFIRMED : BOOKING_STATUSES.PENDING_PAYMENT,
    confirmedAt: confirmed ? now : null,
    lockedUntil: confirmed ? null : new Date(now.getTime() + duration),
  };
}
