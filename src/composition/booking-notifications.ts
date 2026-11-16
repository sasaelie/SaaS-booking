import 'server-only';
import { after } from 'next/server';
import type { JobRunnerPort } from '../core/ports/jobs.port';
import type { CreateBookingOutput } from '../core/use-cases/create-booking.use-case';
import { SendBookingConfirmationUseCase } from '../core/use-cases/send-booking-confirmation.use-case';
import { verifySelfCancelToken } from '../core/domain/self-service-token';
import { BOOKING_STATUSES } from '../config/constants';
export function scheduleBookingConfirmation(
  booking: CreateBookingOutput,
  runner: JobRunnerPort,
  secret: string,
) {
  const token = booking.selfServiceToken;
  if (booking.status !== BOOKING_STATUSES.CONFIRMED || !token) return;
  after(async () => {
    const verified = await verifySelfCancelToken(token, secret, new Date());
    if (!verified.ok || verified.value.bookingId !== booking.bookingId) return;
    await new SendBookingConfirmationUseCase(runner).execute({
      organizationId: verified.value.organizationId,
      bookingId: verified.value.bookingId,
    });
  });
}

export function schedulePaymentConfirmation(
  outcome: {
    readonly status: string;
    readonly organizationId: string | null;
    readonly bookingId: string | null;
  },
  runner: JobRunnerPort,
) {
  if (
    !['CONFIRMED_NOW', 'ALREADY_PROCESSED'].includes(outcome.status) ||
    !outcome.organizationId ||
    !outcome.bookingId
  )
    return;
  const scope = { organizationId: outcome.organizationId, bookingId: outcome.bookingId };
  after(async () => {
    await new SendBookingConfirmationUseCase(runner).execute(scope);
  });
}
