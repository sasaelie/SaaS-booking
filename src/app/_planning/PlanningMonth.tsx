import { PLANNING } from '../../config/planning';
import { dayLabel, localDay, monthLabel, monthOf, timeLabel } from '../_ui/calendar-dates';
import { dateNumber, weekdayLabel, weekDays } from './planning-dates';
import { planningMonthDays } from './planning-period';
import { activityTone, sessionPhase } from './planning-sessions';
import type { PlanningProps, PlanningSession } from './types';
import type { PlanningState } from './use-planning';
type MonthProps = { readonly state: PlanningState; readonly timezone: string } & Pick<
  PlanningProps,
  'selected' | 'onSelect'
>;
export function PlanningMonth({ state, timezone, selected, onSelect }: MonthProps) {
  return (
    <div className="planning-frame">
      <div className="planning-month-weekdays" aria-hidden="true">
        {weekDays(state.day).map((day) => (
          <span key={day}>{weekdayLabel(day, true)}</span>
        ))}
      </div>
      <div className="planning-month" role="group" aria-label={monthLabel(monthOf(state.day))}>
        {planningMonthDays(state.day).map((day, index) =>
          day ? (
            <MonthDay
              key={day}
              state={state}
              timezone={timezone}
              day={day}
              selected={selected}
              onSelect={onSelect}
            />
          ) : (
            <span className="planning-month-blank" key={index} aria-hidden="true" />
          ),
        )}
      </div>
    </div>
  );
}
function sessionCount(count: number) {
  return `${count} ${count === 1 ? PLANNING.SESSION : PLANNING.SESSIONS}`;
}
function MonthDay({
  state,
  timezone,
  day,
  selected,
  onSelect,
}: MonthProps & { readonly day: string }) {
  const sessions = state.byDay.get(day) ?? [];
  return (
    <button
      className="planning-month-day"
      type="button"
      data-day={day}
      aria-current={day === state.today ? 'date' : undefined}
      aria-pressed={day === state.day}
      aria-label={`${dayLabel(day)}, ${sessionCount(sessions.length)}`}
      onClick={() => {
        if (selected && localDay(selected, timezone) !== day) onSelect?.('');
        state.setDay(day);
        state.setView('day');
      }}
    >
      <strong className="planning-month-date">{dateNumber(day)}</strong>
      {sessions.length ? (
        <MonthSessions sessions={sessions} state={state} timezone={timezone} />
      ) : null}
    </button>
  );
}
function MonthSessions({
  sessions,
  state,
  timezone,
}: MonthProps & { readonly sessions: readonly PlanningSession[] }) {
  return (
    <span className="planning-month-summary" aria-hidden="true">
      <span className="planning-month-previews">
        {sessions.slice(0, PLANNING.MONTH_PREVIEW_LIMIT).map((session) => (
          <span
            key={session.id}
            className="planning-month-session"
            data-tone={activityTone(session.activityId)}
            data-phase={sessionPhase(session, state.now)}
          >
            <i />
            <span className="planning-month-session-text">
              {timeLabel(session.startsAt, timezone)} {session.name}
            </span>
          </span>
        ))}
      </span>
      <span className="planning-month-count">
        {sessions.length}
        <span className="planning-month-count-name">
          {' '}
          {sessions.length === 1 ? PLANNING.SESSION : PLANNING.SESSIONS}
        </span>
      </span>
    </span>
  );
}
