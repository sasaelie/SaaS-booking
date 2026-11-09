import type { VoucherStatus } from '../../config/constants';
export interface RescheduleVoucherSnapshot {
  readonly id: string;
  readonly organizationId: string;
  readonly originActivityId: string;
  readonly originBookingId: string;
  readonly code: string;
  readonly initialValueCents: number;
  readonly status: VoucherStatus;
  readonly lockedUntil: Date | null;
  readonly expiresAt: Date;
}
export interface CancellationEligibilityInput {
  readonly sessionStartsAt: Date;
  readonly cancelledAt: Date;
  readonly noticeHoursRequired: number;
  readonly amountPaidCents: number;
  readonly adminOverride?: boolean;
}
export interface CancellationEligibilityOutput {
  readonly eligibleForVoucher: boolean;
  readonly hoursBeforeSession: number;
  readonly voucherValueCents: number;
}
export interface VoucherPricingCalculation {
  readonly targetActivityPriceCents: number;
  readonly voucherInitialValueCents: number;
  readonly appliedDiscountCents: number;
  readonly remainingToPayCents: number;
  readonly forfeitedRemainderCents: number;
  readonly remainderValueCents: number;
  readonly requiresOnlinePayment: boolean;
  readonly nextVoucherStatus: VoucherStatus;
}
