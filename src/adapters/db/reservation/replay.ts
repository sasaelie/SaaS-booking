import type { Transaction } from '../transaction';
import { lockBookingContext } from '../payment/locks';
import { reservationOutput } from './output';
import { BOOKING_STATUSES, ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok, type Result } from '../../../lib/result';
import type {
  AtomicSeatReservationInput,
  AtomicSeatReservationOutput,
} from '../../../core/ports/session-repository.port';
export async function replayReservation(
  tx: Transaction,
  input: AtomicSeatReservationInput,
  bookingId: string,
  now: Date,
): Promise<Result<AtomicSeatReservationOutput>> {
  const context = await lockBookingContext(tx, input.input.organizationId, bookingId);
  const booking = context?.booking;
  if (!booking || booking.requestHash !== input.requestHash)
    return failure(ERROR_CODES.CONFLICT, 'Reservation', 'idempotency');
  const active = [
    BOOKING_STATUSES.CONFIRMED,
    BOOKING_STATUSES.PENDING_PAYMENT,
    BOOKING_STATUSES.PROOF_SUBMITTED,
  ].some((status) => status === booking.status);
  if (
    !active ||
    (booking.status !== BOOKING_STATUSES.CONFIRMED &&
      (!booking.lockedUntil || booking.lockedUntil <= now))
  )
    return failure(ERROR_CODES.CONFLICT, 'Reservation', 'expiredReplay');
  return ok(await reservationOutput(tx, booking, now));
}
