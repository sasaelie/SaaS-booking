import { PLANNING } from '../../config/planning';
import { monthDays, monthOf, shiftMonth } from '../_ui/calendar-dates';
import { shiftDay, weekDays, weekStart } from './planning-dates';
import { planningSessionsByDay } from './planning-session-days';
import type { PlanningProps, PlanningSession, PlanningView } from './types';
function periodStart(day: string, view: PlanningView): string {
  return view === 'month' ? `${monthOf(day)}-01` : weekStart(day);
}
function periodDays(day: string, view: PlanningView): readonly string[] {
  return view === 'month'
    ? monthDays(monthOf(day)).filter((value): value is string => value !== null)
    : weekDays(day);
}
export function planningMonthDays(day: string): readonly (string | null)[] {
  const days = monthDays(monthOf(day));
  const padding = (PLANNING.DAYS - (days.length % PLANNING.DAYS)) % PLANNING.DAYS;
  return [...days, ...Array.from({ length: padding }, () => null)];
}
export function planningPeriod(
  props: PlanningProps,
  day: string,
  view: PlanningView,
  index = planningSessionsByDay(props.sessions, props.timezone),
) {
  const days = day ? periodDays(day, view) : [];
  const ids = new Set(days.flatMap((date) => (index.get(date) ?? []).map((session) => session.id)));
  const sessions = props.sessions.filter((session) => ids.has(session.id));
  if (!day || !props.sessions.length) return { days, sessions, previous: false, next: false };
  const available = [...index.keys()].sort();
  const first = available[0] ?? day;
  const last = available.at(-1) ?? day;
  return {
    days,
    sessions,
    previous: periodStart(day, view) > periodStart(first, view),
    next: periodStart(day, view) < periodStart(last, view),
  };
}
export function movePlanningPeriod(
  day: string,
  direction: number,
  view: PlanningView,
  sessions: readonly PlanningSession[],
  timezone: string,
  index = planningSessionsByDay(sessions, timezone),
) {
  const next =
    view === 'month'
      ? `${shiftMonth(monthOf(day), direction)}-01`
      : shiftDay(weekStart(day), direction * PLANNING.DAYS);
  return periodDays(next, view).find((date) => index.has(date)) ?? next;
}
