import { and, eq } from 'drizzle-orm';
import type { DrizzlePgDb } from './client';
import { atomic, type Transaction } from './transaction';
import { bookings, financialEntries } from './schema';
import { platformAudit } from './schema/saas';
import { lockBookingContext } from './payment/locks';
import { requireMembership } from './portal/authorization';
import { recordFinancialPayment } from './financial-ledger';
import type { RecordedPaymentPort } from '../../core/ports/recorded-payment.port';
import type { PortalActor } from '../../core/ports/portal-models';
import type { RecordedPaymentInput } from '../../core/validation/recorded-payment';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
import { ERROR_CODES } from '../../config/constants';
export class DrizzleRecordedPaymentRepository implements RecordedPaymentPort {
  constructor(private readonly db: DrizzlePgDb) {}
  record(actor: PortalActor, input: RecordedPaymentInput) {
    return atomic(this.db, 'RecordedPayment', (tx) => record(tx, actor, input));
  }
}
async function record(tx: Transaction, actor: PortalActor, input: RecordedPaymentInput) {
  await requireMembership(tx, actor, input.organizationId);
  const context = await lockBookingContext(tx, input.organizationId, input.bookingId);
  const booking = context?.booking;
  if (
    !booking ||
    booking.anonymizedAt ||
    booking.paymentMode !== 'NONE' ||
    booking.status !== 'CONFIRMED'
  )
    return failure(ERROR_CODES.CONFLICT, 'RecordedPayment', 'state');
  const reference = `${input.method}:${input.reference}`;
  const source = `offline:${input.organizationId}:${booking.id}`;
  const [previous] = await tx
    .select()
    .from(financialEntries)
    .where(
      and(
        eq(financialEntries.organizationId, input.organizationId),
        eq(financialEntries.sourceKey, `paid:${source}`),
      ),
    );
  if (previous)
    return previous.amountCents === input.amountCents && previous.reference === reference
      ? ok(undefined)
      : failure(ERROR_CODES.CONFLICT, 'RecordedPayment', 'replay');
  if (
    input.amountCents !==
      booking.unitPriceCents - booking.voucherDiscountCents - booking.amountPaidCents ||
    input.amountCents <= 0
  )
    return failure(ERROR_CODES.VALIDATION_FAILED, 'RecordedPayment', 'amount');
  return persist(tx, actor, input, booking, reference, source);
}
async function persist(
  tx: Transaction,
  actor: PortalActor,
  input: RecordedPaymentInput,
  booking: typeof bookings.$inferSelect,
  reference: string,
  source: string,
) {
  const now = new Date();
  await tx
    .update(bookings)
    .set({ amountPaidCents: booking.amountPaidCents + input.amountCents, paidAt: now })
    .where(and(eq(bookings.id, booking.id), eq(bookings.organizationId, input.organizationId)));
  await recordFinancialPayment(tx, booking.id, source, now, input.amountCents);
  await tx
    .update(financialEntries)
    .set({ reference })
    .where(
      and(
        eq(financialEntries.organizationId, input.organizationId),
        eq(financialEntries.sourceKey, `paid:${source}`),
      ),
    );
  await tx.insert(platformAudit).values({
    organizationId: input.organizationId,
    actorUserId: actor.id,
    action: `OFFLINE_PAYMENT_RECORDED:${booking.id}`,
  });
  return ok(undefined);
}
