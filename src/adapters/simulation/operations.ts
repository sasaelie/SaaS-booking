import { eq, and, sql } from 'drizzle-orm';
import type { DrizzlePgDb } from '../db/client';
import { bookings } from '../db/schema';
import { atomic } from '../db/transaction';
import { DrizzlePaymentRepository } from '../db/drizzle-payment.repository';
import { ERROR_CODES, BOOKING_STATUSES, PAYMENT_MODES } from '../../config/constants';
import { SIMULATION } from '../../config/simulation';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
export async function simulationPayment(db: DrizzlePgDb, org: string, id: string, success: boolean) {
  const result = await preparePayment(db, org, id, success);
  if (!result.ok || !result.value) return result.ok ? ok(undefined) : result;
  const b = result.value;
  const confirmed = await new DrizzlePaymentRepository(db).confirmPaymentOrDetectCollisionAtomically(
    {
      eventId: SIMULATION.REFERENCE_PREFIX + id,
      provider: PAYMENT_MODES.STRIPE,
      bookingId: id,
      organizationId: org,
      paymentReference: SIMULATION.REFERENCE_PREFIX + id,
      checkoutReference: b.checkoutReference ?? SIMULATION.REFERENCE_PREFIX + id,
      amountPaidCents: b.unitPriceCents - b.voucherDiscountCents,
      currency: b.currency,
      merchantAccountId: b.merchantAccountId,
    },
    new Date(),
  );
  return confirmed.ok && confirmed.value.status !== 'REFUND_QUEUED'
    ? ok(undefined)
    : confirmed.ok
      ? failure(ERROR_CODES.CONFLICT, 'Simulation', 'payment-expired')
      : confirmed;
}
function preparePayment(db: DrizzlePgDb, org: string, id: string, success: boolean) {
  return atomic(db, 'Simulation', async (tx) => {
    const [b] = await tx
      .select()
      .from(bookings)
      .where(and(eq(bookings.id, id), eq(bookings.organizationId, org)))
      .for('update');
    if (!b || b.anonymizedAt) return failure(ERROR_CODES.NOT_FOUND, 'Simulation', 'payment');
    if (b.status === BOOKING_STATUSES.CONFIRMED && (b.amountPaidCents > 0 || b.unitPriceCents === 0)) return ok(null);
    if (
      b.status !== BOOKING_STATUSES.PENDING_PAYMENT &&
      !(b.status === BOOKING_STATUSES.CONFIRMED && b.paymentMode === PAYMENT_MODES.NONE)
    )
      return failure(ERROR_CODES.CONFLICT, 'Simulation', 'payment-status');
    await tx.execute(
      sql`INSERT INTO simulation_attempts(booking_id,organization_id,failure) VALUES(${id},${org},${!success}) ON CONFLICT(booking_id) DO UPDATE SET failure=excluded.failure`,
    );
    if (!success) return ok(null);
    if (b.paymentMode !== PAYMENT_MODES.STRIPE) {
      await tx
        .update(bookings)
        .set({
          status: BOOKING_STATUSES.CONFIRMED,
          confirmedAt: new Date(),
          paidAt: new Date(),
          amountPaidCents: b.unitPriceCents - b.voucherDiscountCents,
          lockedUntil: null,
        })
        .where(eq(bookings.id, id));
      return ok(null);
    }
    return ok(b);
  });
}
