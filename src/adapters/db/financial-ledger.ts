import { eq, sql } from 'drizzle-orm';
import { bookings, financialPayments, financialEntries } from './schema';
import type { Transaction } from './transaction';
import { enqueue } from './jobs/enqueue';
import { JOB_TYPES } from '../../config/constants';
type Booking = typeof bookings.$inferSelect;
export async function initializeFinancial(tx: Transaction, booking: Booking) {
  const paid = booking.amountPaidCents;
  const amount =
    booking.paymentMode === 'NONE' ? 0 : booking.unitPriceCents - booking.voucherDiscountCents;
  await tx
    .insert(financialPayments)
    .values({
      organizationId: booking.organizationId,
      bookingId: booking.id,
      commercialPlan: booking.commercialPlan,
      pricingVersion: booking.pricingVersion,
      currency: booking.currency,
      publicAmountCents: amount,
      commissionCents: booking.commissionCents,
      merchantAccountId: booking.merchantAccountId,
      chargeAccountId: booking.chargeModel === 'DIRECT' ? booking.merchantAccountId : null,
      organizationNetCents:
        booking.commercialPlan === 'LIBERTE' ? amount - booking.commissionCents : null,
      status: amount === 0 ? 'RECONCILED' : 'PENDING',
      stripeFeeCents: amount === 0 ? 0 : null,
      ...(amount === 0 ? { organizationNetCents: 0, reconciledAt: new Date() } : {}),
      paidAt: paid > 0 ? booking.paidAt : null,
    })
    .onConflictDoNothing();
  if (booking.appliedVoucherId)
    await tx
      .insert(financialEntries)
      .values({
        organizationId: booking.organizationId,
        bookingId: booking.id,
        kind: 'VOUCHER_USED',
        sourceKey: `voucher-used:${booking.id}`,
        amountCents: booking.voucherDiscountCents,
        reference: booking.appliedVoucherId,
      })
      .onConflictDoNothing();
}
export async function recordFinancialPayment(
  tx: Transaction,
  bookingId: string,
  reference: string,
  paidAt: Date,
) {
  const [booking] = await tx.select().from(bookings).where(eq(bookings.id, bookingId));
  if (!booking) return;
  await initializeFinancial(tx, booking);
  await markPayment(tx, booking, reference, paidAt);
  if (booking.paymentMode === 'STRIPE' && booking.commercialPlan !== 'LEGACY')
    await enqueue(
      tx,
      booking.organizationId,
      JOB_TYPES.FINANCIAL_RECONCILE,
      `financial:${bookingId}`,
      { bookingId },
    );
}
export async function recordFinancialRefund(
  tx: Transaction,
  bookingId: string,
  refundId: string,
  amount: number,
) {
  const [booking] = await tx.select().from(bookings).where(eq(bookings.id, bookingId));
  if (!booking) return;
  const inserted = await tx
    .insert(financialEntries)
    .values({
      organizationId: booking.organizationId,
      bookingId,
      sourceKey: `refund:${refundId}`,
      kind: 'REFUND',
      amountCents: -amount,
      reference: refundId,
    })
    .onConflictDoNothing()
    .returning();
  if (!inserted.length) return;
  await tx.execute(sql`UPDATE financial_payments SET refunded_cents=LEAST(public_amount_cents,refunded_cents+${amount}),organization_net_cents=CASE WHEN ${booking.paymentMode}<>'STRIPE' THEN organization_net_cents-${amount} ELSE organization_net_cents END,status=${booking.commercialPlan === 'LEGACY' ? 'HISTORICAL' : booking.paymentMode === 'STRIPE' ? 'PENDING' : 'RECONCILED'}
    WHERE booking_id=${bookingId} AND organization_id=${booking.organizationId}`);
  if (booking.paymentMode === 'STRIPE' && booking.commercialPlan !== 'LEGACY')
    await enqueue(
      tx,
      booking.organizationId,
      JOB_TYPES.FINANCIAL_RECONCILE,
      `financial-refund:${refundId}`,
      { bookingId },
    );
}

async function markPayment(tx: Transaction, booking: Booking, reference: string, paidAt: Date) {
  const bookingId = booking.id;
  await tx
    .update(financialPayments)
    .set({
      paymentReference: reference,
      paidAt,
      ...(booking.paymentMode !== 'STRIPE'
        ? {
            stripeFeeCents: 0,
            organizationNetCents: booking.amountPaidCents,
            status: 'RECONCILED',
            reconciledAt: paidAt,
          }
        : {}),
    })
    .where(eq(financialPayments.bookingId, bookingId));
  await tx
    .insert(financialEntries)
    .values({
      organizationId: booking.organizationId,
      bookingId,
      sourceKey: `paid:${reference}`,
      kind: 'PAYMENT',
      amountCents: booking.amountPaidCents,
      reference,
    })
    .onConflictDoNothing();
}
