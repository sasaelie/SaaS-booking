import type { ReconciledPayment } from '../../core/ports/financial.port';
import type { Transaction } from '../db/transaction';
import { and, eq } from 'drizzle-orm';
import { BookingJobSchema } from './job-validation';
import type { DrizzlePgDb } from '../db/client';
import type { PaymentGatewayPort } from '../../core/ports/payment-gateway.port';
import { bookings, financialPayments, financialEntries } from '../db/schema';
import { atomic } from '../db/transaction';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
import { ERROR_CODES } from '../../config/constants';
import { recordFinancialRefund } from '../db/financial-ledger';
export async function reconcileFinancial(
  db: DrizzlePgDb,
  gateway: PaymentGatewayPort,
  raw: unknown,
) {
  const payload = BookingJobSchema.parse(raw);
  const [booking] = await db.select().from(bookings).where(eq(bookings.id, payload.bookingId));
  if (!booking?.paymentReference || !gateway.reconcilePayment)
    return failure(ERROR_CODES.CONFIGURATION_ERROR, 'Reconciliation', 'configuration');
  const result = await gateway.reconcilePayment({
    organizationId: booking.organizationId,
    bookingId: booking.id,
    paymentReference: booking.paymentReference,
    merchantAccountId: booking.merchantAccountId,
    chargeModel: booking.chargeModel,
    commissionCents: booking.commissionCents,
  });
  if (!result.ok) return result;
  const value = result.value;
  if (!value) return failure(ERROR_CODES.CONFLICT, 'Reconciliation', 'not-ready');
  if (value.amountCents !== booking.amountPaidCents || value.currency !== booking.currency)
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Reconciliation', 'amount');
  return atomic(db, 'Reconciliation', (tx) => persistReconciliation(tx, booking, value));
}

async function persistReconciliation(
  tx: Transaction,
  booking: typeof bookings.$inferSelect,
  value: ReconciledPayment,
) {
  await lockFinancialBooking(tx, booking.id);
  const [payment] = await tx
    .select()
    .from(financialPayments)
    .where(
      and(
        eq(financialPayments.bookingId, booking.id),
        eq(financialPayments.organizationId, booking.organizationId),
      ),
    )
    .for('update');
  if (!payment) return failure(ERROR_CODES.NOT_FOUND, 'Reconciliation', 'snapshot');
  if (
    value.refundedCents < payment.refundedCents ||
    (value.commissionRefundedCents ?? 0) < payment.commissionRefundedCents
  )
    return failure(ERROR_CODES.CONFLICT, 'Reconciliation', 'stale-refund');
  for (const refund of value.refunds ?? [])
    await recordFinancialRefund(tx, booking.id, refund.id, refund.amountCents);
  await recordCommissionRefund(tx, booking, payment.commissionRefundedCents, value);
  await tx
    .update(financialPayments)
    .set(reconciledValues(booking, value))
    .where(eq(financialPayments.id, payment.id));
  await recordStripeFee(tx, booking, value);
  return ok({});
}

function reconciledValues(booking: typeof bookings.$inferSelect, value: ReconciledPayment) {
  return {
    stripeFeeCents: value.stripeFeeCents,
    transferredCents: value.transferredCents,
    refundedCents: value.refundedCents,
    commissionRefundedCents: value.commissionRefundedCents ?? 0,
    organizationNetCents:
      booking.commercialPlan === 'LIBERTE'
        ? value.amountCents -
          value.refundedCents -
          booking.commissionCents +
          (value.commissionRefundedCents ?? 0)
        : value.amountCents - value.refundedCents - value.stripeFeeCents,
    chargeId: value.chargeId,
    balanceTransactionId: value.balanceTransactionId,
    transferId: value.transferId,
    status: 'RECONCILED',
    reconciledAt: new Date(),
  };
}

async function lockFinancialBooking(tx: Transaction, id: string) {
  await tx.select({ id: bookings.id }).from(bookings).where(eq(bookings.id, id)).for('update');
}

async function recordCommissionRefund(
  tx: Transaction,
  booking: typeof bookings.$inferSelect,
  previous: number,
  value: ReconciledPayment,
) {
  const refunded = value.commissionRefundedCents ?? 0;
  if (refunded <= previous) return;
  await tx
    .insert(financialEntries)
    .values({
      organizationId: booking.organizationId,
      bookingId: booking.id,
      kind: 'ADJUSTMENT',
      sourceKey: `commission-refund:${value.chargeId}:${refunded}`,
      amountCents: refunded - previous,
      reference: value.chargeId,
    })
    .onConflictDoNothing();
}

async function recordStripeFee(
  tx: Transaction,
  booking: typeof bookings.$inferSelect,
  value: ReconciledPayment,
) {
  await tx
    .insert(financialEntries)
    .values({
      organizationId: booking.organizationId,
      bookingId: booking.id,
      kind: 'ADJUSTMENT',
      sourceKey: `stripe-fee:${value.balanceTransactionId}`,
      amountCents: -value.stripeFeeCents,
      reference: value.balanceTransactionId,
    })
    .onConflictDoNothing();
}
