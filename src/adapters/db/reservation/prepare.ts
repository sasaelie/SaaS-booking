import { and, eq } from 'drizzle-orm';
import { bookings } from '../schema';
import { required, type Transaction } from '../transaction';
import { lockSession } from './context';
import { prepareVoucher } from './voucher';
import { generateDynamicTerms } from '../../../core/domain/terms-generator';
import { validateBookingInputWithPolicy } from '../../../core/domain/booking-validation';
import { resolveRequestedSession } from '../../../core/domain/booking-request';
import { calculateSeatAvailability } from '../../../core/domain/seat-calculator';
import type { AtomicSeatReservationInput } from '../../../core/ports/session-repository.port';
import type { ActivityWithScheduleConfig } from '../../../core/ports/booking-ports';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
export interface InsertContext {
  readonly activity: ActivityWithScheduleConfig;
  readonly input: AtomicSeatReservationInput;
  readonly now: Date;
}
async function validateCapacity(
  tx: Transaction,
  session: Awaited<ReturnType<typeof lockSession>>,
  now: Date,
): Promise<void> {
  const snapshots = await tx
    .select()
    .from(bookings)
    .where(
      and(eq(bookings.sessionId, session.id), eq(bookings.organizationId, session.organizationId)),
    );
  const availability = required(calculateSeatAvailability(session.capacity, snapshots, now));
  if (session.isCancelled || !availability.isBookable)
    required(
      failure(
        session.isCancelled ? ERROR_CODES.SESSION_CLOSED_OR_PAUSED : ERROR_CODES.SESSION_FULL,
        'Reservation',
        'capacity',
      ),
    );
}
export async function prepareReservation(tx: Transaction, context: InsertContext) {
  const { activity, input, now } = context;
  const terms = required(await generateDynamicTerms({ ...activity, activityName: activity.name }));
  const data = required(
    validateBookingInputWithPolicy(input.input, {
      audiencePolicy: activity.audiencePolicy,
      requirePhone: activity.requirePhone,
      expectedTermsVersionHash: terms.versionHash,
    }),
  );
  const projected = required(resolveRequestedSession(activity, data.startsAtIso, now));
  const voucher = required(
    await prepareVoucher(
      tx,
      activity.organizationId,
      data.voucherCode,
      activity.priceCents,
      activity.currency,
      now,
    ),
  );
  validatePayment(activity, voucher.remaining);
  const session = await lockSession(
    tx,
    activity.organizationId,
    activity.id,
    projected.startsAt,
    projected.endsAt,
    projected.availability.capacity,
  );
  await validateCapacity(tx, session, now);
  return { terms, data, voucher, session };
}

function validatePayment(activity: ActivityWithScheduleConfig, remaining: number) {
  if (remaining > 0 && activity.paymentReady === false)
    required(
      failure(
        activity.paymentMode === 'BANK_TRANSFER'
          ? ERROR_CODES.BANK_DETAILS_REQUIRED
          : ERROR_CODES.STRIPE_ACCOUNT_REQUIRED,
        'Reservation',
        'payment-configuration',
      ),
    );
}
