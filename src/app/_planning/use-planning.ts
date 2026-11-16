'use client';
import { useMemo, useState } from 'react';
import { localDay } from '../_ui/calendar-dates';
import { currentDay } from './planning-dates';
import { planningPeriod, movePlanningPeriod } from './planning-period';
import { planningSessionsByDay } from './planning-session-days';
import { usePlanningContainer } from './use-planning-container';
import { usePlanningClock } from './use-planning-clock';
import type { PlanningProps, PlanningView } from './types';
export function usePlanning(props: PlanningProps) {
  const first = props.selected || props.sessions[0]?.startsAt || '';
  const [day, setDay] = useState(() => (first ? localDay(first, props.timezone) : ''));
  const [view, setView] = useState<PlanningView>('week');
  const { compact, container } = usePlanningContainer();
  const now = usePlanningClock();
  const byDay = useMemo(
    () => planningSessionsByDay(props.sessions, props.timezone),
    [props.sessions, props.timezone],
  );
  const period = planningPeriod(props, day, view, byDay);
  function move(direction: number) {
    setDay(movePlanningPeriod(day, direction, view, props.sessions, props.timezone, byDay));
  }
  return {
    day,
    setDay,
    view,
    setView,
    compact,
    container,
    now,
    today: currentDay(now, props.timezone),
    ...period,
    byDay,
    visibleDays: compact || view === 'day' ? [day] : period.days,
    move,
  };
}
export type PlanningState = ReturnType<typeof usePlanning>;
