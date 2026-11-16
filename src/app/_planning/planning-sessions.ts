import { TIME } from '../../config/constants';
import { PLANNING } from '../../config/planning';
import type { PlanningSession, PositionedSession } from './types';
import { localDay } from '../_ui/calendar-dates';
import { localMinute } from './planning-dates';
export function activityTone(id: string): string {
  const hash = [...id].reduce(
    (value, char) => (value * PLANNING.HASH_FACTOR + char.charCodeAt(0)) >>> 0,
    0,
  );
  return PLANNING.TONES[hash % PLANNING.TONES.length] ?? PLANNING.TONES[0];
}
export function sessionPhase(session: PlanningSession, now: number | null) {
  if (session.isCancelled) return 'cancelled';
  if (now !== null && now >= Date.parse(session.endsAt)) return 'past';
  if (now !== null && now >= Date.parse(session.startsAt)) return 'current';
  return 'future';
}
export function sessionStatus(session: PlanningSession, now: number | null): string {
  const phase = sessionPhase(session, now);
  if (phase === 'past') return PLANNING.ENDED;
  if (phase === 'current') return PLANNING.ONGOING;
  if (phase === 'cancelled') return PLANNING.CANCELLED;
  return session.availability;
}
export function sessionOccursOnDay(session: PlanningSession, day: string, timezone: string) {
  const startDay = localDay(session.startsAt, timezone),
    endDay = localDay(session.endsAt, timezone);
  return (
    startDay <= day &&
    (endDay > day || (endDay === day && localMinute(session.endsAt, timezone) > 0))
  );
}
export function sessionMinutes(
  session: PlanningSession,
  timezone: string,
  day = localDay(session.startsAt, timezone),
) {
  const start =
    localDay(session.startsAt, timezone) === day ? localMinute(session.startsAt, timezone) : 0;
  const end =
    localDay(session.endsAt, timezone) === day
      ? localMinute(session.endsAt, timezone)
      : PLANNING.MINUTES_PER_DAY;
  const elapsed = (Date.parse(session.endsAt) - Date.parse(session.startsAt)) / TIME.MINUTE_MS;
  return { start, end: end > start ? end : start + elapsed };
}
export function timelineRange(sessions: readonly PlanningSession[], timezone: string) {
  const minutes = sessions.flatMap((session) => {
    const lastDay = localDay(session.endsAt, timezone);
    const first = sessionMinutes(session, timezone);
    return sessionOccursOnDay(session, lastDay, timezone)
      ? [first, sessionMinutes(session, timezone, lastDay)]
      : [first];
  });
  const start =
    Math.floor(
      Math.min(PLANNING.DEFAULT_START, ...minutes.map((item) => item.start)) /
        PLANNING.MINUTES_PER_HOUR,
    ) * PLANNING.MINUTES_PER_HOUR;
  const end =
    Math.ceil(
      Math.max(PLANNING.DEFAULT_END, ...minutes.map((item) => item.end)) /
        PLANNING.MINUTES_PER_HOUR,
    ) * PLANNING.MINUTES_PER_HOUR;
  return { start, end };
}
export function positionSessions(
  sessions: readonly PlanningSession[],
  timezone: string,
  day?: string,
): readonly PositionedSession[] {
  const rows = sessions
    .map((session) => ({ session, ...sessionMinutes(session, timezone, day) }))
    .sort((a, b) => a.start - b.start || a.session.id.localeCompare(b.session.id));
  const result: PositionedSession[] = [];
  let group: PositionedSession[] = [],
    groupEnd = -1;
  const flush = () => {
    const columns = Math.max(1, ...group.map((item) => item.column + 1));
    result.push(...group.map((item) => ({ ...item, columns })));
    group = [];
  };
  for (const row of rows) {
    if (row.start >= groupEnd) flush();
    const blocked = new Set(
      group
        .filter((item) => Math.max(item.end, item.start + PLANNING.MIN_EVENT_MINUTES) > row.start)
        .map((item) => item.column),
    );
    let column = 0;
    while (blocked.has(column)) column++;
    group.push({ ...row, column, columns: 1 });
    groupEnd = Math.max(
      ...group.map((item) => Math.max(item.end, item.start + PLANNING.MIN_EVENT_MINUTES)),
    );
  }
  flush();
  return result;
}
