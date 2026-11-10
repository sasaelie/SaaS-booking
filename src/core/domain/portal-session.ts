import type { ActivityWithScheduleConfig } from '../ports/booking-ports';
import type { PersistedSession } from './session-types';
import type { PortalSession } from '../ports/portal-models';
import { publicSchedule } from './public-booking-page';
import { calculateSeatAvailability } from './seat-calculator';
import { isOverlappingPause } from './schedule-session';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
export function describePortalSession(
  activity: ActivityWithScheduleConfig,
  startsAt: Date,
  now: Date,
): Result<PortalSession> {
  const persisted = activity.manualSessions.find(
    (session) => session.startsAt.getTime() === startsAt.getTime(),
  );
  if (persisted) return persistedDetails(activity, persisted, now);
  const schedule = publicSchedule({ ...activity, pausePeriods: [] }, now);
  if (!schedule.ok) return schedule;
  const session = schedule.value.find((row) => row.startsAt.getTime() === startsAt.getTime());
  return session
    ? ok({
        id: null,
        activityId: activity.id,
        activityName: activity.name,
        startsAt: session.startsAt,
        endsAt: session.endsAt,
        capacity: session.availability.capacity,
        availabilityLabel: session.availability.displayLabel,
        isManual: false,
        isCancelled: isOverlappingPause(session.startsAt, session.endsAt, activity.pausePeriods),
      })
    : failure(ERROR_CODES.NOT_FOUND, 'Session', 'details');
}

function persistedDetails(
  activity: ActivityWithScheduleConfig,
  persisted: PersistedSession,
  now: Date,
) {
  const available = calculateSeatAvailability(
    persisted.capacity,
    activity.bookingsBySessionId[persisted.id] ?? [],
    now,
  );
  if (!available.ok) return available;
  return ok({
    ...persisted,
    activityName: activity.name,
    availabilityLabel: available.value.displayLabel,
    isCancelled:
      persisted.isCancelled ||
      (!persisted.isManual &&
        isOverlappingPause(persisted.startsAt, persisted.endsAt, activity.pausePeriods)),
  });
}
