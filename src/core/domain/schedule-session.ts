import { TIME, ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import { calculateSeatAvailability } from './seat-calculator';
import { validDate } from './date-math';
import type {
  BuildScheduleInput,
  ComputedCalendarSession,
  PersistedSession,
} from './session-types';
export function isOverlappingPause(
  startsAt: Date,
  endsAt: Date,
  pauses: BuildScheduleInput['pausePeriods'],
): boolean {
  return pauses.some((pause) => startsAt < pause.endsAt && endsAt > pause.startsAt);
}
export function isInRange(session: PersistedSession, input: BuildScheduleInput): boolean {
  const horizon = input.now.getTime() + input.bookingWindowWeeks * TIME.DAYS_PER_WEEK * TIME.DAY_MS;
  return (
    !session.isCancelled &&
    session.startsAt > input.now &&
    session.startsAt >= input.rangeStart &&
    session.startsAt <= input.rangeEnd &&
    (session.isManual || session.startsAt.getTime() <= horizon)
  );
}
export function computeSession(
  session: PersistedSession,
  input: BuildScheduleInput,
): Result<ComputedCalendarSession | null> {
  if (![session.startsAt, session.endsAt].every(validDate) || session.endsAt <= session.startsAt)
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Schedule', 'computeSession');
  if (
    !isInRange(session, input) ||
    (!session.isManual && isOverlappingPause(session.startsAt, session.endsAt, input.pausePeriods))
  )
    return ok(null);
  const bookings = input.bookingsBySessionId[session.id] ?? [];
  const availability = calculateSeatAvailability(session.capacity, bookings, input.now);
  if (!availability.ok) return availability;
  return ok({
    activityId: input.activityId,
    persistedSessionId: session.id || null,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    isManual: session.isManual,
    availability: availability.value,
  });
}
