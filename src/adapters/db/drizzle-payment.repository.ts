import { eq } from 'drizzle-orm';
import { processedWebhooks } from './schema';
import { atomic, type Transaction } from './transaction';
import type { DrizzlePgDb } from './client';
import { lockBookingContext } from './payment/locks';
import { canConfirm, confirmBooking } from './payment/confirm';
import { matchesBooking } from './payment/verify';
import { queueCollision } from './payment/collision';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import type {
  ParsedWebhookPaymentEvent,
  AtomicConfirmOutcome,
  BookingPaymentRepositoryPort,
} from '../../core/ports/payment-gateway.port';
async function processEvent(
  tx: Transaction,
  event: ParsedWebhookPaymentEvent,
  now: Date,
): Promise<Result<AtomicConfirmOutcome>> {
  const context = await lockBookingContext(tx, event.organizationId, event.bookingId);
  if (!context) return failure(ERROR_CODES.NOT_FOUND, 'Payment', 'confirm');
  const { booking } = context;
  if (!matchesBooking(booking, event)) return failure(ERROR_CODES.CONFLICT, 'Payment', 'verify');
  const [seen] = await tx
    .select()
    .from(processedWebhooks)
    .where(eq(processedWebhooks.eventId, event.eventId));
  if (seen || booking.paymentReference === event.paymentReference)
    return ok({ status: 'ALREADY_PROCESSED', bookingId: booking.id });
  await tx.insert(processedWebhooks).values({
    eventId: event.eventId,
    organizationId: event.organizationId,
    provider: event.provider,
  });
  if (await canConfirm(tx, context, now)) {
    await confirmBooking(tx, context, event, now);
    return ok({ status: 'CONFIRMED_NOW', bookingId: booking.id });
  }
  await queueCollision(tx, booking, event, now);
  return ok({ status: 'REFUND_QUEUED', bookingId: booking.id });
}
export class DrizzlePaymentRepository implements BookingPaymentRepositoryPort {
  constructor(private readonly db: DrizzlePgDb) {}
  confirmPaymentOrDetectCollisionAtomically(
    event: ParsedWebhookPaymentEvent,
    now: Date,
  ): Promise<Result<AtomicConfirmOutcome>> {
    return atomic(this.db, 'Payment', (tx) => processEvent(tx, event, now));
  }
}
