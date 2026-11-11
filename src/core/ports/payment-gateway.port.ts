import type { PaymentMode } from '../../config/constants';
import type { Result } from '../../lib/result';
export interface InitiatePaymentInput {
  readonly commissionCents?: number;
  readonly chargeModel?: import('../../config/commercial').ChargeModel;
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
  readonly chargeAccountId?: string | null;
  readonly eventId: string;
  readonly provider: PaymentMode;
  readonly bookingId: string;
  readonly organizationId: string;
  readonly paymentReference: string;
  readonly checkoutReference: string;
  readonly amountPaidCents: number;
  readonly currency: string;
  readonly merchantAccountId: string | null;
}
export interface RefundPaymentInput {
  readonly chargeModel?: import('../../config/commercial').ChargeModel;
  readonly paymentReference: string;
  readonly amountCents: number;
  readonly reason: string;
  readonly idempotencyKey: string;
  readonly merchantAccountId: string | null;
}
export interface PaymentGatewayPort {
  reconcilePayout?(
    input: import('./financial.port').FinancialPayoutInput,
  ): Promise<Result<import('./financial.port').ReconciledPayout>>;
  reconcilePayment?: import('./financial.port').PaymentReconciliationPort['reconcilePayment'];
  readonly mode: PaymentMode;
  initiatePayment(input: InitiatePaymentInput): Promise<Result<InitiatePaymentOutput>>;
  verifyWebhookAndParse(
    rawBody: string,
    signatureHeader: string,
  ): Promise<Result<ParsedWebhookPaymentEvent | null>>;
  refundPayment(input: RefundPaymentInput): Promise<Result<{ readonly refundId: string }>>;
}
export type AtomicConfirmOutcome = {
  readonly status: 'CONFIRMED_NOW' | 'ALREADY_PROCESSED' | 'REFUND_QUEUED';
  readonly bookingId: string;
};
export interface BookingPaymentRepositoryPort {
  confirmPaymentOrDetectCollisionAtomically(
    event: ParsedWebhookPaymentEvent,
    now: Date,
  ): Promise<Result<AtomicConfirmOutcome>>;
}
