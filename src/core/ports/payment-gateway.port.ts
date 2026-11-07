// src/core/ports/payment-gateway.port.ts
import type { PaymentMode } from '../../config/constants';
import type { AppError, Result } from '../../lib/result';

export interface InitiatePaymentInput {
  readonly organizationId: string;
  readonly bookingId: string;
  readonly activityName: string;
  readonly amountCents: number;
  readonly currency: string;
  readonly customerEmail: string;
  readonly expiresAt: Date;
  readonly successUrl: string;
  readonly cancelUrl: string;
  readonly merchantAccountId: string | null;
}
export interface InitiatePaymentOutput {
  readonly paymentReference: string;
  readonly checkoutUrl: string;
  readonly expiresAt: Date;
}
export interface ParsedWebhookPaymentEvent {
  readonly eventId: string;
  readonly provider: PaymentMode;
  readonly bookingId: string;
  readonly paymentReference: string;
  readonly amountPaidCents: number;
}
export interface RefundPaymentInput {
  readonly paymentReference: string;
  readonly amountCents?: number;
  readonly reason: string;
}
export interface PaymentGatewayPort {
  readonly mode: PaymentMode;
  initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<Result<InitiatePaymentOutput, AppError>>;
  verifyWebhookAndParse(
    rawBody: string,
    signatureHeader: string,
  ): Promise<Result<ParsedWebhookPaymentEvent | null, AppError>>;
  refundPayment(
    input: RefundPaymentInput,
  ): Promise<Result<{ readonly refundId: string }, AppError>>;
}
export type AtomicConfirmOutcome =
  | {
      readonly status: 'CONFIRMED_NOW';
      readonly bookingId: string;
      readonly organizationName: string;
      readonly activityName: string;
      readonly attendeeFirstName: string;
      readonly attendeeEmail: string;
      readonly startsAt: Date;
      readonly endsAt: Date;
      readonly timezone: string;
      readonly amountPaidCents: number;
      readonly currency: string;
    }
  | { readonly status: 'ALREADY_PROCESSED' }
  | {
      readonly status: 'COLLISION_OVERBOOKED';
      readonly bookingId: string;
      readonly attendeeEmail: string;
    };
export interface BookingPaymentRepositoryPort {
  /** Déduplique eventId, verrouille la séance, confirme ou détecte une collision, enregistre eventId. */
  confirmPaymentOrDetectCollisionAtomically(
    event: ParsedWebhookPaymentEvent,
    now: Date,
  ): Promise<Result<AtomicConfirmOutcome, AppError>>;
}
