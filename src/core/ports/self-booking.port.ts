import type { Result } from '../../lib/result';
import type { BookingStatus, PaymentMode } from '../../config/constants';
import type { SelfCancelTokenPayload } from '../validation/self-service';
export interface SelfBookingSnapshot {
  readonly amountPaidCents?: number;
  readonly voucherDiscountCents?: number;
  readonly currency?: string;
  readonly noticeHoursForVoucher?: number;
  readonly voucherValidityMonths?: number;
  readonly organizationSlug: string;
  readonly organizationName: string;
  readonly activityId: string;
  readonly activityName: string;
  readonly startsAt: Date;
  readonly participantHue?: number | null;
  readonly timezone: string;
  readonly status: BookingStatus;
  readonly paymentMode: PaymentMode;
  readonly lockedUntil: Date | null;
  readonly hasProof: boolean;
}
export interface SelfBookingRepositoryPort {
  read(payload: SelfCancelTokenPayload): Promise<Result<SelfBookingSnapshot>>;
}
