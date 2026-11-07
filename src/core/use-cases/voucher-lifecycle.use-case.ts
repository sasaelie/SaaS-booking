// src/core/use-cases/voucher-lifecycle.use-case.ts
import { PAYMENT_RULES } from '../../config/constants';
import { ok, type AppError, type Result } from '../../lib/result';
import {
  computeVoucherExpiryDate,
  evaluateCancellationEligibility,
  generateFormattedVoucherCode,
  type RescheduleVoucherSnapshot,
  type VoucherPricingCalculation,
} from '../domain/voucher-engine';
import type {
  VoucherNotificationPayload,
  VoucherRepositoryPort,
} from '../ports/voucher.port';
export interface CancelByAttendeeInput {
  readonly organizationId: string;
  readonly bookingId: string;
  readonly baseBookingUrl: string;
  readonly adminOverride?: boolean;
}
export interface CancelByAttendeeOutput {
  readonly bookingCancelled: true;
  readonly voucherIssued: boolean;
  readonly voucher: RescheduleVoucherSnapshot | null;
  readonly qrBookingUrl: string | null;
}
export interface VoucherLifecycleDeps {
  readonly voucherRepo: VoucherRepositoryPort;
  readonly sendVoucherEmail: (
    payload: VoucherNotificationPayload,
  ) => Promise<Result<void, AppError>>;
  readonly randomBytesProvider?: (length: number) => Uint8Array;
  readonly nowProvider?: () => Date;
}
function defaultRandomBytes(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}
export class VoucherLifecycleUseCase {
  public constructor(private readonly deps: VoucherLifecycleDeps) {}
  public async cancelByAttendee(
    input: CancelByAttendeeInput,
  ): Promise<Result<CancelByAttendeeOutput, AppError>> {
    const now = this.deps.nowProvider ? this.deps.nowProvider() : new Date();
    const ctxRes =
      await this.deps.voucherRepo.getBookingContextForAttendeeCancellation(
        input.organizationId,
        input.bookingId,
      );
    if (!ctxRes.ok) return ctxRes;
    const ctx = ctxRes.value;
    const eligibilityRes = evaluateCancellationEligibility({
      sessionStartsAt: ctx.sessionStartsAt,
      cancelledAt: now,
      noticeHoursRequired: ctx.noticeHoursForVoucher,
      amountPaidCents: ctx.amountPaidCents,
      adminOverride: input.adminOverride,
    });
    if (!eligibilityRes.ok) return eligibilityRes;
    if (!eligibilityRes.value.eligibleForVoucher) {
      const cancelOnlyRes =
        await this.deps.voucherRepo.cancelBookingWithoutVoucherAtomically(
          input.organizationId,
          input.bookingId,
        );
      if (!cancelOnlyRes.ok) return cancelOnlyRes;
      return ok({
        bookingCancelled: true,
        voucherIssued: false,
        voucher: null,
        qrBookingUrl: null,
      });
    }
    const getBytes = this.deps.randomBytesProvider ?? defaultRandomBytes;
    const codeRes = generateFormattedVoucherCode(getBytes(8));
    if (!codeRes.ok) return codeRes;
    const expiresAt = computeVoucherExpiryDate(now, ctx.voucherValidityMonths);
    const issuedRes =
      await this.deps.voucherRepo.cancelBookingAndCreateVoucherAtomically({
        bookingId: ctx.bookingId,
        organizationId: ctx.organizationId,
        originActivityId: ctx.activityId,
        code: codeRes.value,
        initialValueCents: eligibilityRes.value.voucherValueCents,
        expiresAt,
      });
    if (!issuedRes.ok) return issuedRes;
    const qrBookingUrl = `${input.baseBookingUrl}?voucher=${encodeURIComponent(issuedRes.value.code)}`;
    await this.deps.sendVoucherEmail({
      attendeeEmail: ctx.attendeeEmail,
      attendeeFirstName: ctx.attendeeFirstName,
      voucherCode: issuedRes.value.code,
      initialValueCents: issuedRes.value.initialValueCents,
      expiresAt,
      qrBookingUrl,
    });
    return ok({
      bookingCancelled: true,
      voucherIssued: true,
      voucher: issuedRes.value,
      qrBookingUrl,
    });
  }
  public async applyVoucherToBooking(params: {
    readonly organizationId: string;
    readonly code: string;
    readonly targetActivityPriceCents: number;
  }): Promise<
    Result<
      {
        readonly voucher: RescheduleVoucherSnapshot;
        readonly pricing: VoucherPricingCalculation;
      },
      AppError
    >
  > {
    const now = this.deps.nowProvider ? this.deps.nowProvider() : new Date();
    const lockDurationMs = PAYMENT_RULES.STRIPE_HOLD_MINUTES * 60_000;
    return this.deps.voucherRepo.lockAndApplyVoucherForBookingAtomically({
      organizationId: params.organizationId,
      code: params.code.trim().toUpperCase(),
      targetActivityPriceCents: params.targetActivityPriceCents,
      lockDurationMs,
      now,
    });
  }
  public async redeemForOnlineCourse(params: {
    readonly organizationId: string;
    readonly code: string;
  }): Promise<Result<RescheduleVoucherSnapshot, AppError>> {
    const now = this.deps.nowProvider ? this.deps.nowProvider() : new Date();
    return this.deps.voucherRepo.redeemVoucherForExternalBenefitAtomically({
      organizationId: params.organizationId,
      code: params.code.trim().toUpperCase(),
      now,
    });
  }
}
