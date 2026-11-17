import { PLANNING } from '../../config/planning';
import { sessionMinutes, sessionOccursOnDay, timelineRange } from './planning-sessions';
import type { PlanningSession } from './types';
export function planningRange(
  sessions: readonly PlanningSession[],
  timezone: string,
  days: readonly string[],
  fullDay: boolean,
) {
  if (fullDay) return { start: 0, end: PLANNING.MINUTES_PER_DAY };
  const minutes = days.flatMap((day) =>
    sessions
      .filter((session) => sessionOccursOnDay(session, day, timezone))
      .map((session) => sessionMinutes(session, timezone, day)),
  );
  if (!minutes.length) return timelineRange([], timezone);
  const hour = PLANNING.MINUTES_PER_HOUR;
  const start = Math.floor(Math.min(...minutes.map((item) => item.start)) / hour) * hour;
  const end = Math.ceil(Math.max(...minutes.map((item) => item.end)) / hour) * hour;
  return { start, end: Math.max(end, start + hour) };
}
