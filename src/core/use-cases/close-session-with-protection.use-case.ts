// src/core/use-cases/close-session-with-protection.use-case.ts
import { PAYMENT_MODES, PAYMENT_RULES } from '../../config/constants';
import { ok, type AppError, type Result } from '../../lib/result';
import type { SessionClosureRepositoryPort } from '../ports/bank-and-closure.port';
import type { PaymentGatewayPort } from '../ports/payment-gateway.port';
export interface CloseSessionInput {
  readonly organizationId: string;
  readonly sessionId: string;
  readonly confirmCancelExistingBookings: boolean;
  readonly reason: string;
}
export type CloseSessionOutcome =
  | {
      readonly status: 'CONFIRMATION_REQUIRED';
      readonly affectedBookingsCount: number;
      readonly warningMessage: string;
    }
  | {
      readonly status: 'CLOSED_AND_REFUNDED';
      readonly cancelledBookingsCount: number;
      readonly stripeAutoRefundIds: readonly string[];
      readonly manualBankRefundsRequired: readonly {
        readonly bookingId: string;
        readonly attendeeEmail: string;
        readonly amountCents: number;
        readonly deadlineDays: number;
      }[];
    };
export interface CloseSessionDeps {
  readonly closureRepo: SessionClosureRepositoryPort;
  readonly stripeGateway: PaymentGatewayPort;
  readonly notifySessionCancelledByOrganizer: (params: {
    readonly bookingId: string;
    readonly attendeeEmail: string;
    readonly reason: string;
    readonly refundMode:
      | 'AUTOMATIC_STRIPE'
      | 'MANUAL_BANK_WITHIN_30_DAYS'
      | 'NONE';
  }) => Promise<Result<void, AppError>>;
}
export class CloseSessionWithProtectionUseCase {
  public constructor(private readonly deps: CloseSessionDeps) {}
  public async execute(
    input: CloseSessionInput,
  ): Promise<Result<CloseSessionOutcome, AppError>> {
    const activeRes = await this.deps.closureRepo.listActiveBookingsForSession(
      input.organizationId,
      input.sessionId,
    );
    if (!activeRes.ok) return activeRes;
    const activeBookings = activeRes.value;
    if (activeBookings.length > 0 && !input.confirmCancelExistingBookings) {
      return ok({
        status: 'CONFIRMATION_REQUIRED',
        affectedBookingsCount: activeBookings.length,
        warningMessage: `Attention : ${activeBookings.length} réservation(s) active(s) seront annulées et devront être intégralement remboursées.`,
      });
    }
    const stripeAutoRefundIds: string[] = [];
    const manualBankRefundsRequired: {
      bookingId: string;
      attendeeEmail: string;
      amountCents: number;
      deadlineDays: number;
    }[] = [];
    for (const booking of activeBookings) {
      if (
        booking.paymentMode === PAYMENT_MODES.STRIPE &&
        booking.amountPaidCents > 0 &&
        booking.paymentReference
      ) {
        const refundRes = await this.deps.stripeGateway.refundPayment({
          paymentReference: booking.paymentReference,
          amountCents: booking.amountPaidCents,
          reason: input.reason,
        });
        if (!refundRes.ok) return refundRes;
        stripeAutoRefundIds.push(refundRes.value.refundId);
        await this.deps.notifySessionCancelledByOrganizer({
          bookingId: booking.bookingId,
          attendeeEmail: booking.attendeeEmail,
          reason: input.reason,
          refundMode: 'AUTOMATIC_STRIPE',
        });
      } else if (
        booking.paymentMode === PAYMENT_MODES.BANK_TRANSFER &&
        booking.amountPaidCents > 0
      ) {
        manualBankRefundsRequired.push({
          bookingId: booking.bookingId,
          attendeeEmail: booking.attendeeEmail,
          amountCents: booking.amountPaidCents,
          deadlineDays: PAYMENT_RULES.ORGANIZER_REFUND_DEADLINE_DAYS,
        });
        await this.deps.notifySessionCancelledByOrganizer({
          bookingId: booking.bookingId,
          attendeeEmail: booking.attendeeEmail,
          reason: input.reason,
          refundMode: 'MANUAL_BANK_WITHIN_30_DAYS',
        });
      } else {
        await this.deps.notifySessionCancelledByOrganizer({
          bookingId: booking.bookingId,
          attendeeEmail: booking.attendeeEmail,
          reason: input.reason,
          refundMode: 'NONE',
        });
      }
    }
    const cancelDbRes =
      await this.deps.closureRepo.markSessionAndBookingsCancelledByOrganizerAtomically(
        input.organizationId,
        input.sessionId,
      );
    if (!cancelDbRes.ok) return cancelDbRes;
    return ok({
      status: 'CLOSED_AND_REFUNDED',
      cancelledBookingsCount: activeBookings.length,
      stripeAutoRefundIds,
      manualBankRefundsRequired,
    });
  }
}
