import { guardUseCase } from '../../lib/guard-use-case';
import { signSelfCancelToken } from '../domain/self-service-token';
import { TIME, TOKEN_RULES } from '../../config/constants';
import { PAYMENT_MODES, BOOKING_STATUSES, ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import { sha256 } from '../../lib/sha256';
import { parseBookingInput } from '../domain/booking-validation';
import type {
  SessionRepositoryPort,
  AtomicSeatReservationOutput,
} from '../ports/session-repository.port';
import type { PaymentGatewayPort } from '../ports/payment-gateway.port';
export type CreateBookingOutput = Pick<
  AtomicSeatReservationOutput,
  | 'bankInstructions'
  | 'bookingId'
  | 'sessionId'
  | 'status'
  | 'amountToPayCents'
  | 'lockedUntil'
  | 'availabilityAfterBooking'
  | 'checkoutUrl'
> & { readonly selfServiceToken?: string };
export interface CreateBookingUseCaseDeps {
  readonly sessionRepo: SessionRepositoryPort;
  readonly paymentGateway: PaymentGatewayPort;
  readonly appUrl: string;
  readonly secret: string;
}
function publicOutput(booking: AtomicSeatReservationOutput): CreateBookingOutput {
  const {
    bankInstructions,
    bookingId,
    sessionId,
    status,
    amountToPayCents,
    lockedUntil,
    availabilityAfterBooking,
    checkoutUrl,
  } = booking;
  return {
    bankInstructions,
    bookingId,
    sessionId,
    status,
    amountToPayCents,
    lockedUntil,
    availabilityAfterBooking,
    checkoutUrl,
  };
}
async function checkout(
  deps: CreateBookingUseCaseDeps,
  booking: AtomicSeatReservationOutput,
): Promise<Result<CreateBookingOutput>> {
  if (
    booking.checkoutUrl ||
    booking.paymentMode !== PAYMENT_MODES.STRIPE ||
    booking.status !== BOOKING_STATUSES.PENDING_PAYMENT
  )
    return ok(publicOutput(booking));
  if (!booking.lockedUntil) return failure(ERROR_CODES.CONFLICT, 'CreateBooking', 'checkout');
  const result = await deps.paymentGateway.initiatePayment({
    organizationId: booking.organizationId,
    bookingId: booking.bookingId,
    activityName: booking.activityName,
    amountCents: booking.amountToPayCents,
    currency: booking.currency,
    customerEmail: booking.attendeeEmail,
    expiresAt: booking.lockedUntil,
    successUrl: `${deps.appUrl}/booking-result`,
    cancelUrl: `${deps.appUrl}/booking-result`,
    merchantAccountId: booking.merchantAccountId,
  });
  if (!result.ok) return result;
  const attached = await deps.sessionRepo.attachCheckout({
    organizationId: booking.organizationId,
    bookingId: booking.bookingId,
    checkoutReference: result.value.paymentReference,
    checkoutUrl: result.value.checkoutUrl,
    expiresAt: result.value.expiresAt,
  });
  return attached.ok
    ? ok({
        ...publicOutput(booking),
        checkoutUrl: result.value.checkoutUrl,
        lockedUntil: result.value.expiresAt,
      })
    : attached;
}
export class CreateBookingUseCase {
  constructor(private readonly deps: CreateBookingUseCaseDeps) {}
  async execute(raw: unknown): Promise<Result<CreateBookingOutput>> {
    return guardUseCase('create-booking.use-case.ts', 'execute', async () => {
      const input = parseBookingInput(raw);
      if (!input.ok) return input;
      const hash = await sha256(JSON.stringify(input.value));
      if (!hash.ok) return hash;
      const booked = await this.deps.sessionRepo.reserveSeatAtomically({
        input: input.value,
        requestHash: hash.value,
      });
      if (!booked.ok) return booked;
      const output = await checkout(this.deps, booked.value);
      if (!output.ok) return output;
      const token = await signSelfCancelToken(
        {
          organizationId: booked.value.organizationId,
          bookingId: booked.value.bookingId,
          version: 0,
          expUnixSeconds: Math.floor(
            (Date.now() + TOKEN_RULES.DURATION_DAYS * TIME.DAY_MS) / TIME.SECOND_MS,
          ),
        },
        this.deps.secret,
      );
      return token.ok ? ok({ ...output.value, selfServiceToken: token.value }) : token;
    });
  }
}
