import { PLANNING } from '../../config/planning';
import { dayLabel, timeLabel } from '../_ui/calendar-dates';
import { dateNumber, weekdayLabel } from './planning-dates';
import { activityTone, sessionPhase, sessionStatus } from './planning-sessions';
import type { PlanningSession } from './types';
import type { PlanningState } from './use-planning';
type WeekProps = { readonly state: PlanningState; readonly timezone: string };
export function PlanningWeek({ state, timezone }: WeekProps) {
  return (
    <div className="planning-frame">
      <div className="planning-week" role="group" aria-label={PLANNING.WEEK_OVERVIEW}>
        {state.days.map((day) => (
          <WeekDay key={day} state={state} timezone={timezone} day={day} />
        ))}
      </div>
    </div>
  );
}
function WeekDay({ state, timezone, day }: WeekProps & { readonly day: string }) {
  const sessions = state.byDay.get(day) ?? [];
  const count = `${sessions.length} ${sessions.length === 1 ? PLANNING.SESSION : PLANNING.SESSIONS}`;
  return (
    <button
      type="button"
      className="planning-week-day"
      data-day={day}
      aria-current={day === state.today ? 'date' : undefined}
      aria-pressed={day === state.day}
      aria-label={`${dayLabel(day)}, ${count}, ${PLANNING.OPEN_DAY}`}
      onClick={() => state.openDay(day)}
    >
      <span className="planning-week-date" aria-hidden="true">
        <small>{weekdayLabel(day, true)}</small>
        <strong>{dateNumber(day)}</strong>
      </span>
      <WeekSummary sessions={sessions} state={state} timezone={timezone} />
      <span className="planning-week-arrow" aria-hidden="true">
        ›
      </span>
    </button>
  );
}
function WeekSummary({
  sessions,
  state,
  timezone,
}: WeekProps & { readonly sessions: readonly PlanningSession[] }) {
  const ordered = sessions.toSorted((a, b) => a.startsAt.localeCompare(b.startsAt));
  return (
    <span className="planning-week-summary" aria-hidden="true">
      {ordered.length ? (
        ordered
          .slice(0, PLANNING.WEEK_PREVIEW_LIMIT)
          .map((session) => (
            <WeekSession key={session.id} session={session} state={state} timezone={timezone} />
          ))
      ) : (
        <span className="planning-week-empty">{PLANNING.DAY_EMPTY}</span>
      )}
      {ordered.length > PLANNING.WEEK_PREVIEW_LIMIT ? (
        <small className="planning-week-more">
          +{ordered.length - PLANNING.WEEK_PREVIEW_LIMIT}{' '}
          {ordered.length - PLANNING.WEEK_PREVIEW_LIMIT === 1
            ? PLANNING.SESSION
            : PLANNING.SESSIONS}
        </small>
      ) : null}
    </span>
  );
}
function WeekSession({
  session,
  state,
  timezone,
}: WeekProps & { readonly session: PlanningSession }) {
  return (
    <span
      className="planning-week-session"
      data-tone={activityTone(session.activityId)}
      data-phase={sessionPhase(session, state.now)}
    >
      <i />
      <span>
        <strong>{session.name}</strong>
        <span className="planning-week-meta">
          <span>
            {timeLabel(session.startsAt, timezone)} – {timeLabel(session.endsAt, timezone)}
          </span>
          <span>{sessionStatus(session, state.now)}</span>
        </span>
      </span>
    </span>
  );
}
