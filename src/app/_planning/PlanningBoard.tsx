import { useEffect, type CSSProperties } from 'react';
import { CALENDAR_UI } from '../../config/constants';
import { PLANNING } from '../../config/planning';
import { dateNumber, weekdayLabel } from './planning-dates';
import { positionSessions } from './planning-sessions';
import { planningRange } from './planning-range';
import { PlanningEvent } from './PlanningEvent';
import type { PlanningProps } from './types';
import type { PlanningState } from './use-planning';
type BoardProps = PlanningProps & { readonly state: PlanningState };
export function PlanningBoard({ state, ...props }: BoardProps) {
  useEffect(() => {
    if (state.view === 'day')
      state.container.current
        ?.querySelector<HTMLElement>('.planning-day-heading[data-selected="true"]')
        ?.focus();
  }, [state.view, state.container]);
  const range = planningRange(state.sessions, props.timezone, state.visibleDays, state.fullDay);
  const style = {
    '--planning-days': state.visibleDays.length,
    '--planning-duration': range.end - range.start,
  } as CSSProperties;
  return (
    <div className="planning-frame">
      <div className="planning-board" style={style}>
        <PlanningHours range={range} />
        {state.visibleDays.map((day) => (
          <PlanningDay key={day} {...props} state={state} day={day} rangeStart={range.start} />
        ))}
      </div>
    </div>
  );
}
function PlanningHours({
  range,
}: {
  readonly range: { readonly start: number; readonly end: number };
}) {
  return (
    <div className="planning-hours" aria-hidden="true">
      {Array.from({ length: (range.end - range.start) / PLANNING.MINUTES_PER_HOUR }, (_, index) => (
        <span key={index} style={{ '--hour-offset': index } as CSSProperties}>
          {String(range.start / PLANNING.MINUTES_PER_HOUR + index).padStart(
            CALENDAR_UI.TWO_DIGITS,
            '0',
          )}
          :00
        </span>
      ))}
    </div>
  );
}
function PlanningDay({
  state,
  day,
  rangeStart,
  ...props
}: BoardProps & { readonly day: string; readonly rangeStart: number }) {
  const sessions = state.byDay.get(day) ?? [];
  return (
    <div className="planning-day">
      <div
        className="planning-day-heading"
        tabIndex={-1}
        aria-current={day === state.today ? 'date' : undefined}
        data-selected={day === state.day}
      >
        <span>{weekdayLabel(day)}</span>
        <strong>{dateNumber(day)}</strong>
        <span className="ice-sr-only">{day === state.today ? PLANNING.TODAY : ''}</span>
      </div>
      <div className="planning-lane">
        {positionSessions(sessions, props.timezone, day).map((row) => (
          <PlanningEvent
            key={row.session.id}
            row={row}
            timezone={props.timezone}
            now={state.now}
            rangeStart={rangeStart}
            selected={props.selected}
            onSelect={props.onSelect}
          />
        ))}
      </div>
    </div>
  );
}
