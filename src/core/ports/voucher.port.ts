// src/core/ports/voucher.port.ts
import type { AppError, Result } from '../../lib/result';
import type {
  RescheduleVoucherSnapshot,
  VoucherPricingCalculation,
} from '../domain/voucher-engine';

export interface AttendeeCancellationContext {
  readonly bookingId: string;
  readonly organizationId: string;
  readonly activityId: string;
  readonly attendeeEmail: string;
  readonly attendeeFirstName: string;
  readonly sessionStartsAt: Date;
  readonly amountPaidCents: number;
  readonly noticeHoursForVoucher: number;
  readonly voucherValidityMonths: number;
  readonly allowExternalBenefitExchange: boolean;
}
export interface IssueVoucherOnCancelInput {
  readonly bookingId: string;
  readonly organizationId: string;
  readonly originActivityId: string;
  readonly code: string;
  readonly initialValueCents: number;
  readonly expiresAt: Date;
}
export interface VoucherNotificationPayload {
  readonly attendeeEmail: string;
  readonly attendeeFirstName: string;
  readonly voucherCode: string;
  readonly initialValueCents: number;
  readonly expiresAt: Date;
  readonly qrBookingUrl: string;
}
export interface VoucherRepositoryPort {
  getBookingContextForAttendeeCancellation(
    organizationId: string,
    bookingId: string,
  ): Promise<Result<AttendeeCancellationContext, AppError>>;
  cancelBookingWithoutVoucherAtomically(
    organizationId: string,
    bookingId: string,
  ): Promise<Result<void, AppError>>;
  cancelBookingAndCreateVoucherAtomically(
    input: IssueVoucherOnCancelInput,
  ): Promise<Result<RescheduleVoucherSnapshot, AppError>>;
  lockAndApplyVoucherForBookingAtomically(params: {
    readonly organizationId: string;
    readonly code: string;
    readonly targetActivityPriceCents: number;
    readonly lockDurationMs: number;
    readonly now: Date;
  }): Promise<
    Result<
      {
        readonly voucher: RescheduleVoucherSnapshot;
        readonly pricing: VoucherPricingCalculation;
      },
      AppError
    >
  >;
  redeemVoucherForExternalBenefitAtomically(params: {
    readonly organizationId: string;
    readonly code: string;
    readonly now: Date;
  }): Promise<Result<RescheduleVoucherSnapshot, AppError>>;
}
