import type { Result } from '../../lib/result';
export interface AccountingPayment {
  readonly bookingId: string;
  readonly commercialPlan: string;
  readonly currency: string;
  readonly pricingVersion: string;
  readonly publicAmountCents: number;
  readonly commissionCents: number;
  readonly commissionRefundedCents: number;
  readonly commissionTaxCents: number | null;
  readonly stripeFeeCents: number | null;
  readonly organizationNetCents: number | null;
  readonly refundedCents: number;
  readonly transferredCents: number | null;
  readonly status: string;
  readonly paidAt: Date | null;
  readonly createdAt: Date;
  readonly paymentReference: string | null;
  readonly balanceTransactionId: string | null;
  readonly transferId: string | null;
  readonly payoutId: string | null;
  readonly payoutStatus: string | null;
}
export interface AccountingEntry {
  readonly createdAt: Date;
  readonly kind: string;
  readonly bookingId: string | null;
  readonly currency: string;
  readonly amountCents: number;
  readonly reference: string | null;
}
export interface AccountingReport {
  readonly organizationName: string;
  readonly organizationSlug: string;
  readonly generatedAt: Date;
  readonly payments: readonly AccountingPayment[];
  readonly entries: readonly AccountingEntry[];
}
export interface AccountingWorkbookPort {
  build(report: AccountingReport): Promise<Result<Uint8Array>>;
}
