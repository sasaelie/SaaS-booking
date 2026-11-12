import type { Result } from '../../lib/result';
import type { ChargeModel } from '../../config/commercial';
import type { PortalActor } from './portal-models';
export interface FinancialPaymentInput {
  readonly commissionCents?: number;
  readonly organizationId: string;
  readonly bookingId: string;
  readonly paymentReference: string;
  readonly merchantAccountId: string | null;
  readonly chargeModel: ChargeModel;
}
export interface ReconciledPayment {
  readonly refunds?: readonly { readonly id: string; readonly amountCents: number }[];
  readonly transferredCents?: number | null;
  readonly chargeId: string;
  readonly balanceTransactionId: string;
  readonly amountCents: number;
  readonly stripeFeeCents: number;
  readonly currency: string;
  readonly transferId: string | null;
  readonly refundedCents: number;
  readonly commissionRefundedCents?: number;
}
export interface PaymentReconciliationPort {
  reconcilePayment(input: FinancialPaymentInput): Promise<Result<ReconciledPayment | null>>;
}
export interface FinancialPayoutInput {
  readonly organizationId: string;
  readonly merchantAccountId: string;
  readonly payoutId: string;
}
export interface ReconciledPayout {
  readonly status: string;
  readonly paymentReferences: readonly string[];
}
export interface FinancialSummary {
  readonly commissionCents: number;
  readonly stripeFeeCents: number;
  readonly avoidableCents: number;
  readonly pendingCount: number;
  readonly reconciledCount: number;
}
export interface FinancialRepositoryPort {
  report(actor: PortalActor, organizationId: string): Promise<Result<import('./accounting.port').AccountingReport>>;
  recordCost(actor: PortalActor, input: import('../validation/commercial').PlatformCostInput): Promise<Result<void>>;
  selectActivities(actor: PortalActor, organizationId: string, activityIds: readonly string[]): Promise<Result<void>>;
  summary(actor: PortalActor, organizationId: string): Promise<Result<FinancialSummary>>;
  export(actor: PortalActor, organizationId: string): Promise<Result<string>>;
}
