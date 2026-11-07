// src/core/ports/session-repository.port.ts
import type { BookingStatus } from '../../config/constants';
import type { AppError, Result } from '../../lib/result';
import type {
  PersistedSession,
  SeatAvailability,
} from '../domain/session-types';

export interface AtomicSeatReservationInput {
  readonly organizationId: string;
  readonly activityId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly defaultCapacity: number;
  readonly now: Date;
  readonly booking: {
    readonly idempotencyKey: string;
    readonly status: BookingStatus;
    readonly firstName: string;
    readonly lastName: string;
    readonly email: string;
    readonly phone: string | null;
    readonly marketingOptIn: boolean;
    readonly unitPriceCents: number;
    readonly voucherDiscountCents: number;
    readonly amountPaidCents: number;
    readonly appliedVoucherId: string | null;
    readonly lockedUntil: Date | null;
    readonly termsAcceptedAt: Date;
    readonly termsVersionHash: string;
  };
}
export interface AtomicSeatReservationOutput {
  readonly bookingId: string;
  readonly session: PersistedSession;
  readonly availabilityAfterBooking: SeatAvailability;
}
export interface SessionRepositoryPort {
  /** Une transaction : Upsert, SELECT FOR UPDATE, calcul des places, insertion ou SESSION_FULL. */
  reserveSeatAtomically(
    input: AtomicSeatReservationInput,
  ): Promise<Result<AtomicSeatReservationOutput, AppError>>;
}
