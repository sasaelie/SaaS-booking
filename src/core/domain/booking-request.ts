import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import { buildTruthSchedule } from './session-truth';
import type { ActivityWithScheduleConfig } from '../ports/booking-ports';
import type { ComputedCalendarSession } from './session-types';
export function resolveRequestedSession(
  activity: ActivityWithScheduleConfig,
  startsAtIso: string,
  now: Date,
): Result<ComputedCalendarSession> {
  if (!activity.isActive)
    return failure(ERROR_CODES.SESSION_CLOSED_OR_PAUSED, 'Booking', 'resolveRequestedSession');
  const start = new Date(startsAtIso);
  const result = buildTruthSchedule({
    organizationId: activity.organizationId,
    activityId: activity.id,
    timezone: activity.timezone,
    bookingWindowWeeks: activity.bookingWindowWeeks,
    now,
    rangeStart: start,
    rangeEnd: start,
    weeklySlots: activity.weeklySlots,
    pausePeriods: activity.pausePeriods,
    persistedSessions: activity.manualSessions,
    bookingsBySessionId: {},
  });
  if (!result.ok) return result;
  const match = result.value.find((session) => session.startsAt.getTime() === start.getTime());
  return match
    ? ok(match)
    : failure(ERROR_CODES.SESSION_CLOSED_OR_PAUSED, 'Booking', 'resolveRequestedSession');
}
