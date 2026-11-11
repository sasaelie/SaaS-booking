import type { Result } from '../../lib/result';
import type { BookingStatus, PaymentMode } from '../../config/constants';
import type { ValidatedCreateBookingInput } from '../domain/booking-validation';
import type { SeatAvailability } from '../domain/session-types';
export interface AtomicSeatReservationInput {
  readonly input: ValidatedCreateBookingInput;
  readonly requestHash: string;
}
export interface AtomicSeatReservationOutput {
  readonly commissionCents?: number;
  readonly chargeModel?: import('../../config/commercial').ChargeModel;
  readonly bankInstructions: {
    readonly iban: string;
    readonly accountName: string;
    readonly reference: string;
  } | null;
  readonly bookingId: string;
  readonly sessionId: string;
  readonly organizationId: string;
  readonly status: BookingStatus;
  readonly paymentMode: PaymentMode;
  readonly amountToPayCents: number;
  readonly lockedUntil: Date | null;
  readonly availabilityAfterBooking: SeatAvailability;
  readonly checkoutUrl: string | null;
  readonly activityName: string;
  readonly currency: string;
  readonly attendeeEmail: string;
  readonly merchantAccountId: string | null;
}
export interface SessionRepositoryPort {
  reserveSeatAtomically(
    input: AtomicSeatReservationInput,
  ): Promise<Result<AtomicSeatReservationOutput>>;
  attachCheckout(params: {
    readonly organizationId: string;
    readonly bookingId: string;
    readonly checkoutReference: string;
    readonly checkoutUrl: string;
    readonly expiresAt: Date;
  }): Promise<Result<void>>;
}
