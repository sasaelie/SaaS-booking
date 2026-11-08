import { paymentConfiguration } from './portal/payment-configuration';
import { requireCommercialAccess } from './portal/access';
import { replayReservation } from './reservation/replay';
import { lockBookingContext } from './payment/locks';
import { and, eq } from 'drizzle-orm';
import type {
  SessionRepositoryPort,
  AtomicSeatReservationInput,
  AtomicSeatReservationOutput,
} from '../../core/ports/session-repository.port';
import { ERROR_CODES, BOOKING_STATUSES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import { bookings, rescheduleVouchers } from './schema';
import { atomic, required, type Transaction } from './transaction';
import { lockActivity, readActivity } from './activity-reader';
import { reservationClock, existingBooking } from './reservation/context';
import { reservationOutput } from './reservation/output';
import { insertReservation } from './reservation/insert';
import type { DrizzlePgDb } from './client';
export type { DrizzlePgDb } from './client';
async function reserve(
  tx: Transaction,
  input: AtomicSeatReservationInput,
): Promise<Result<AtomicSeatReservationOutput>> {
  const now = await reservationClock(tx, input);
  const existing = await existingBooking(tx, input);
  if (existing) return replayReservation(tx, input, existing.id, now);
  await lockActivity(tx, input.input.organizationId, input.input.activityId);
  await requireCommercialAccess(tx, input.input.organizationId, new Date());
  const activity = required(
    await readActivity(tx, input.input.organizationId, input.input.activityId),
  );
  required(await paymentConfiguration(tx, input.input.organizationId, activity.paymentMode));
  return ok(
    await reservationOutput(tx, await insertReservation(tx, { activity, input, now }), now),
  );
}
export class DrizzleSessionRepository implements SessionRepositoryPort {
  constructor(private readonly db: DrizzlePgDb) {}
  reserveSeatAtomically(
    input: AtomicSeatReservationInput,
  ): Promise<Result<AtomicSeatReservationOutput>> {
    return atomic(this.db, 'Reservation', (tx) => reserve(tx, input));
  }
  attachCheckout(
    input: Parameters<SessionRepositoryPort['attachCheckout']>[0],
  ): Promise<Result<void>> {
    return atomic(this.db, 'Checkout', async (tx) => {
      const context = await lockBookingContext(tx, input.organizationId, input.bookingId);
      const booking = context?.booking;
      if (!booking || booking.status !== BOOKING_STATUSES.PENDING_PAYMENT)
        return failure(ERROR_CODES.CONFLICT, 'Checkout', 'attach');
      if (booking.checkoutReference && booking.checkoutReference !== input.checkoutReference)
        return failure(ERROR_CODES.CONFLICT, 'Checkout', 'attach');
      await tx
        .update(bookings)
        .set({
          checkoutReference: input.checkoutReference,
          checkoutUrl: input.checkoutUrl,
          lockedUntil: input.expiresAt,
        })
        .where(eq(bookings.id, booking.id));
      if (booking.appliedVoucherId)
        await tx
          .update(rescheduleVouchers)
          .set({ lockedUntil: input.expiresAt })
          .where(
            and(
              eq(rescheduleVouchers.id, booking.appliedVoucherId),
              eq(rescheduleVouchers.lockedBookingId, booking.id),
            ),
          );
      return ok(undefined);
    });
  }
}
