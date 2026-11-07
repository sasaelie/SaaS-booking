// src/core/domain/seat-calculator.ts
import { BOOKING_STATUSES, ERROR_CODES } from '../../config/constants';
import { failAndLog } from '../../lib/logger';
import { ok, type AppError, type Result } from '../../lib/result';
import type { SeatAvailability, SessionBookingSnapshot } from './session-types';

export function isSeatCurrentlyOccupied(
  booking: SessionBookingSnapshot,
  now: Date,
): boolean {
  if (booking.status === BOOKING_STATUSES.CONFIRMED) return true;
  const isHoldingSeat =
    booking.status === BOOKING_STATUSES.PENDING_PAYMENT ||
    booking.status === BOOKING_STATUSES.PROOF_SUBMITTED;
  if (!isHoldingSeat || booking.lockedUntil === null) return false;
  return booking.lockedUntil.getTime() > now.getTime();
}
export function calculateSeatAvailability(
  capacity: number,
  bookings: readonly SessionBookingSnapshot[],
  now: Date,
): Result<SeatAvailability, AppError> {
  if (!Number.isInteger(capacity) || capacity < 0) {
    return failAndLog({
      code: ERROR_CODES.VALIDATION_FAILED,
      module: 'SeatCalculator',
      fn: 'calculateSeatAvailability',
      cause: 'Capacité de séance invalide',
      received: String(capacity),
      expected: 'entier >= 0',
    });
  }
  let occupiedCount = 0;
  for (const booking of bookings) {
    if (isSeatCurrentlyOccupied(booking, now)) occupiedCount += 1;
  }
  const remainingSeats = Math.max(0, capacity - occupiedCount);
  return ok({
    capacity,
    occupiedSeats: occupiedCount,
    remainingSeats,
    displayLabel: `${remainingSeats} / ${capacity}`,
    isBookable: remainingSeats > 0,
  });
}
