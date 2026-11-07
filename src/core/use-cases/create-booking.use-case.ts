// src/core/use-cases/create-booking.use-case.ts
import {
  BOOKING_STATUSES,
  ERROR_CODES,
  PAYMENT_MODES,
  PAYMENT_RULES,
  type BookingStatus,
} from '../../config/constants';
import { failAndLog } from '../../lib/logger';
import { ok, type AppError, type Result } from '../../lib/result';
import {
  validateBookingInputWithPolicy,
  type RawCreateBookingInput,
} from '../domain/booking-validation';
import { buildTruthSchedule } from '../domain/session-truth';
import type { SeatAvailability } from '../domain/session-types';
import { generateDynamicTerms } from '../domain/terms-generator';
import type {
  ActivityRepositoryPort,
  ActivityWithScheduleConfig,
  NotificationPort,
} from '../ports/booking-ports';
import type { SessionRepositoryPort } from '../ports/session-repository.port';
export interface CreateBookingUseCaseDeps {
  readonly activityRepo: ActivityRepositoryPort;
  readonly sessionRepo: SessionRepositoryPort;
  readonly notificationPort: NotificationPort;
  readonly nowProvider?: () => Date;
}
export interface CreateBookingOutput {
  readonly bookingId: string;
  readonly sessionId: string;
  readonly status: BookingStatus;
  readonly amountToPayCents: number;
  readonly lockedUntil: Date | null;
  readonly availabilityAfterBooking: SeatAvailability;
}
function resolveInitialBookingState(
  paymentMode: ActivityWithScheduleConfig['paymentMode'],
  now: Date,
): { readonly status: BookingStatus; readonly lockedUntil: Date | null } {
  if (paymentMode === PAYMENT_MODES.NONE)
    return { status: BOOKING_STATUSES.CONFIRMED, lockedUntil: null };
  const holdMs =
    paymentMode === PAYMENT_MODES.STRIPE
      ? PAYMENT_RULES.STRIPE_HOLD_MINUTES * 60_000
      : PAYMENT_RULES.BANK_TRANSFER_HOLD_HOURS * 3_600_000;
  return {
    status: BOOKING_STATUSES.PENDING_PAYMENT,
    lockedUntil: new Date(now.getTime() + holdMs),
  };
}
export class CreateBookingUseCase {
  public constructor(private readonly deps: CreateBookingUseCaseDeps) {}
  public async execute(
    rawInput: RawCreateBookingInput,
  ): Promise<Result<CreateBookingOutput, AppError>> {
    const now = this.deps.nowProvider ? this.deps.nowProvider() : new Date();
    const activityRes =
      await this.deps.activityRepo.getActivityWithScheduleConfig(
        rawInput.organizationId,
        rawInput.activityId,
      );
    if (!activityRes.ok) return activityRes;
    const activity = activityRes.value;
    const expectedTerms = generateDynamicTerms({
      organizationName: activity.organizationName,
      activityName: activity.name,
      priceCents: activity.priceCents,
      currency: activity.currency,
      audiencePolicy: activity.audiencePolicy,
      paymentMode: activity.paymentMode,
      noticeHoursForVoucher: activity.noticeHoursForVoucher,
      voucherValidityMonths: activity.voucherValidityMonths,
      allowExternalBenefitExchange: activity.allowExternalBenefitExchange,
    });
    const validatedRes = validateBookingInputWithPolicy(rawInput, {
      audiencePolicy: activity.audiencePolicy,
      requirePhone: activity.requirePhone,
      expectedTermsVersionHash: expectedTerms.versionHash,
    });
    if (!validatedRes.ok) return validatedRes;
    const input = validatedRes.value;
    const requestedStart = new Date(input.startsAtIso);
    const scheduleRes = buildTruthSchedule({
      activityId: activity.id,
      timezone: activity.timezone,
      bookingWindowWeeks: activity.bookingWindowWeeks,
      now,
      rangeStart: new Date(requestedStart.getTime() - 86_400_000),
      rangeEnd: new Date(requestedStart.getTime() + 86_400_000),
      weeklySlots: activity.weeklySlots,
      pausePeriods: activity.pausePeriods,
      persistedSessions: activity.manualSessions,
      bookingsBySessionId: {},
    });
    if (!scheduleRes.ok) return scheduleRes;
    const matchedSession = scheduleRes.value.find(
      (s) => s.startsAt.getTime() === requestedStart.getTime(),
    );
    if (!matchedSession) {
      return failAndLog({
        code: ERROR_CODES.SESSION_CLOSED_OR_PAUSED,
        module: 'CreateBookingUseCase',
        fn: 'execute',
        cause:
          'Séance absente de la Règle de vérité (en pause, hors fenêtre ou inexistante)',
        received: input.startsAtIso,
        expected: 'créneau ouvert dans buildTruthSchedule',
      });
    }
    const initialState = resolveInitialBookingState(activity.paymentMode, now);
    const atomicRes = await this.deps.sessionRepo.reserveSeatAtomically({
      organizationId: activity.organizationId,
      activityId: activity.id,
      startsAt: matchedSession.startsAt,
      endsAt: matchedSession.endsAt,
      defaultCapacity: matchedSession.availability.capacity,
      now,
      booking: {
        idempotencyKey: input.idempotencyKey,
        status: initialState.status,
        firstName: input.firstName,
        lastName: input.lastName,
        email: input.email,
        phone: input.phone,
        marketingOptIn: input.marketingOptIn,
        unitPriceCents: activity.priceCents,
        voucherDiscountCents: 0,
        amountPaidCents:
          initialState.status === BOOKING_STATUSES.CONFIRMED
            ? activity.priceCents
            : 0,
        appliedVoucherId: null,
        lockedUntil: initialState.lockedUntil,
        termsAcceptedAt: now,
        termsVersionHash: expectedTerms.versionHash,
      },
    });
    if (!atomicRes.ok) return atomicRes;
    if (initialState.status === BOOKING_STATUSES.CONFIRMED) {
      await this.deps.notificationPort.sendBookingConfirmation({
        bookingId: atomicRes.value.bookingId,
        organizationName: activity.organizationName,
        activityName: activity.name,
        attendeeFirstName: input.firstName,
        attendeeEmail: input.email,
        startsAt: matchedSession.startsAt,
        endsAt: matchedSession.endsAt,
        timezone: activity.timezone,
        amountPaidCents: activity.priceCents,
        currency: activity.currency,
      });
    }
    return ok({
      bookingId: atomicRes.value.bookingId,
      sessionId: atomicRes.value.session.id,
      status: initialState.status,
      amountToPayCents: activity.priceCents,
      lockedUntil: initialState.lockedUntil,
      availabilityAfterBooking: atomicRes.value.availabilityAfterBooking,
    });
  }
}
