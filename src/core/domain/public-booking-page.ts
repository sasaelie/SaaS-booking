import { INPUT_LIMITS, TIME } from '../../config/constants';
import type { ActivityWithScheduleConfig } from '../ports/booking-ports';
import type { GeneratedTermsDocument } from './terms-generator';
import type { ComputedCalendarSession } from './session-types';
import { buildTruthSchedule } from './session-truth';
export function publicSchedule(activity: ActivityWithScheduleConfig, now: Date) {
  return buildTruthSchedule({
    organizationId: activity.organizationId,
    activityId: activity.id,
    timezone: activity.timezone,
    bookingWindowWeeks: activity.bookingWindowWeeks,
    now,
    rangeStart: now,
    rangeEnd: new Date(now.getTime() + INPUT_LIMITS.MAX_RANGE_DAYS * TIME.DAY_MS),
    weeklySlots: activity.weeklySlots,
    pausePeriods: activity.pausePeriods,
    persistedSessions: activity.manualSessions,
    bookingsBySessionId: activity.bookingsBySessionId,
  });
}
export function publicBookingPage(
  activity: ActivityWithScheduleConfig,
  terms: GeneratedTermsDocument,
  schedule: readonly ComputedCalendarSession[],
) {
  const {
    organizationId,
    id: activityId,
    organizationName,
    name: activityName,
    priceCents,
    currency,
    audiencePolicy,
    requirePhone,
    primaryTextColor,
    timezone,
  } = activity;
  return {
    organizationId,
    activityId,
    organizationName,
    activityName,
    priceCents,
    currency,
    audiencePolicy,
    requirePhone,
    primaryTextColor,
    timezone,
    terms,
    slots: schedule.map((session) => ({
      startsAtIso: session.startsAt.toISOString(),
      endsAtIso: session.endsAt.toISOString(),
      availabilityLabel: session.availability.displayLabel,
      isBookable: session.availability.isBookable,
    })),
  };
}
