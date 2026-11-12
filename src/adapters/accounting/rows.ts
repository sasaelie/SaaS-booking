import type { AccountingPayment, AccountingEntry } from '../../core/ports/accounting.port';
import { ACCOUNTING as A } from '../../config/accounting';
import { MONEY } from '../../config/constants';
export function money(cents: number | null) {
  return cents === null ? A.PENDING : cents / MONEY.CENTS_PER_UNIT;
}
export function paymentCells(p: AccountingPayment) {
  const paid = p.paidAt !== null;
  const reconciled = paid && p.status === 'RECONCILED';
  return [
    p.bookingId,
    p.paidAt?.toISOString() ?? A.UNPAID,
    p.commercialPlan,
    p.currency,
    money(p.publicAmountCents),
    paid ? money(p.publicAmountCents) : 0,
    paid ? money(p.commissionCents) : 0,
    paid ? money(p.commissionRefundedCents) : 0,
    paid ? money(p.commissionTaxCents) : A.UNPAID,
    reconciled ? money(p.stripeFeeCents) : paid ? A.PENDING : A.UNPAID,
    money(p.refundedCents),
    reconciled ? money(p.organizationNetCents) : paid ? A.PENDING : A.UNPAID,
    paid ? money(p.transferredCents) : A.UNPAID,
    p.status,
    p.paymentReference ?? '',
    p.balanceTransactionId ?? '',
    p.transferId ?? '',
    p.payoutId ?? '',
    p.payoutStatus ?? '',
    p.pricingVersion,
  ];
}
export function entryCells(e: AccountingEntry) {
  return [e.createdAt.toISOString(), e.kind, e.bookingId ?? '', e.currency, money(e.amountCents), e.reference ?? ''];
}
