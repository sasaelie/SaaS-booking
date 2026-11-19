'use client';
import { localDay } from '../_ui/calendar-dates';
import { PLANNING } from '../../config/planning';
import { usePlanning } from './use-planning';
import { PlanningNavigation } from './PlanningNavigation';
import { PlanningBoard } from './PlanningBoard';
import { PlanningMonth } from './PlanningMonth';
import { PlanningWeek } from './PlanningWeek';
import { activityTone } from './planning-sessions';
import type { PlanningProps } from './types';
export function SessionPlanning(props: PlanningProps) {
  const state = usePlanning(props);
  function select(iso: string) {
    state.setDay(localDay(iso, props.timezone));
    props.onSelect?.(iso);
  }
  if (!state.day) return null;
  return (
    <section
      className="session-planning"
      ref={state.container}
      aria-label={PLANNING.VIEW}
      data-compact={state.compact}
      data-view={state.view}
      data-day-view={state.view === 'day'}
    >
      <PlanningNavigation state={state} timezone={props.timezone} />
      {!state.sessions.length ? (
        <p className="planning-empty">
          {state.view === 'month' ? PLANNING.MONTH_EMPTY : PLANNING.EMPTY}
        </p>
      ) : null}
      {state.view === 'month' ? (
        <PlanningMonth state={state} timezone={props.timezone} />
      ) : state.view === 'week' && state.compact ? (
        <PlanningWeek state={state} timezone={props.timezone} />
      ) : (
        <PlanningBoard {...props} state={state} onSelect={select} />
      )}
      <PlanningLegend sessions={props.sessions} />
    </section>
  );
}
function PlanningLegend({ sessions }: Pick<PlanningProps, 'sessions'>) {
  const activities = [
    ...new Map(sessions.map((session) => [session.activityId, session.name])).entries(),
  ];
  return (
    <div className="planning-legend">
      {activities.map(([id, name]) => (
        <span key={id} data-tone={activityTone(id)}>
          <i aria-hidden="true" />
          {name}
        </span>
      ))}
      <span data-tone="off">
        <i aria-hidden="true" />
        {PLANNING.EXPIRED_KEY}
      </span>
    </div>
  );
}
