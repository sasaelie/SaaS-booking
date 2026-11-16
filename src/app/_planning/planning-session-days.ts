import { localDay } from '../_ui/calendar-dates';
import { localMinute, shiftDay } from './planning-dates';
import type { PlanningSession } from './types';
export function planningSessionsByDay(sessions: readonly PlanningSession[], timezone: string) {
  const index = new Map<string, PlanningSession[]>();
  for (const session of sessions) {
    const first = localDay(session.startsAt, timezone);
    const end = localDay(session.endsAt, timezone);
    const last = localMinute(session.endsAt, timezone) === 0 ? shiftDay(end, -1) : end;
    for (let day = first; day <= last; day = shiftDay(day, 1)) {
      const rows = index.get(day) ?? [];
      rows.push(session);
      index.set(day, rows);
    }
  }
  return index;
}
