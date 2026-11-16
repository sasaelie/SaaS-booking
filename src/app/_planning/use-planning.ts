'use client';
import { useState } from 'react';
import { PLANNING } from '../../config/planning';
import { localDay } from '../_ui/calendar-dates';
import { shiftDay, weekDays, weekStart, currentDay } from './planning-dates';
import { sessionOccursOnDay } from './planning-sessions';
import { usePlanningContainer } from './use-planning-container';
import { usePlanningClock } from './use-planning-clock';
import type { PlanningProps } from './types';
export function usePlanning(props: PlanningProps) {
  const first = props.selected || props.sessions[0]?.startsAt || '';
  const [day, setDay] = useState(() => (first ? localDay(first, props.timezone) : ''));
  const [view, setView] = useState<'week' | 'day'>('week');
  const { compact, container } = usePlanningContainer();
  const now = usePlanningClock();
  const days = day ? weekDays(day) : [];
  const sessions = props.sessions.filter((session) =>
    days.some((day) => sessionOccursOnDay(session, day, props.timezone)),
  );
  const { firstWeek, lastWeek } = planningBounds(props);
  function move(direction: number) {
    const next = shiftDay(weekStart(day), direction * PLANNING.DAYS);
    const match = props.sessions.find(
      (session) => weekStart(localDay(session.startsAt, props.timezone)) === next,
    );
    setDay(match ? localDay(match.startsAt, props.timezone) : next);
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
    days,
    sessions,
    visibleDays: compact || view === 'day' ? [day] : days,
    previous: Boolean(day) && weekStart(day) > firstWeek,
    next: Boolean(day) && weekStart(day) < lastWeek,
    move,
  };
}
export type PlanningState = ReturnType<typeof usePlanning>;

function planningBounds(props: PlanningProps) {
  if (!props.sessions.length) return { firstWeek: '', lastWeek: '' };
  const start = Math.min(...props.sessions.map((session) => Date.parse(session.startsAt)));
  const end = Math.max(...props.sessions.map((session) => Date.parse(session.endsAt))) - 1;
  return {
    firstWeek: weekStart(localDay(new Date(start).toISOString(), props.timezone)),
    lastWeek: weekStart(localDay(new Date(end).toISOString(), props.timezone)),
  };
}
