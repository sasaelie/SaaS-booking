import { PLANNING } from '../../config/planning';
import { dayLabel } from '../_ui/calendar-dates';
import { dateNumber, weekdayLabel, weekLabel } from './planning-dates';
import type { PlanningState } from './use-planning';
export function PlanningNavigation({
  state,
  timezone,
}: {
  readonly state: PlanningState;
  readonly timezone: string;
}) {
  return (
    <>
      <div className="planning-toolbar">
        <div className="planning-period">
          <strong aria-live="polite">{weekLabel(state.day)}</strong>
          <small>{timezone}</small>
        </div>
        <PlanningControls state={state} />
      </div>
      <PlanningDays state={state} />
    </>
  );
}
function PlanningControls({ state }: { readonly state: PlanningState }) {
  return (
    <div className="planning-controls">
      <button
        type="button"
        aria-label={PLANNING.PREVIOUS}
        disabled={!state.previous}
        onClick={() => state.move(-1)}
      >
        ←
      </button>
      <button
        type="button"
        aria-label={PLANNING.NEXT}
        disabled={!state.next}
        onClick={() => state.move(1)}
      >
        →
      </button>
      <div className="planning-modes" role="group" aria-label={PLANNING.VIEW}>
        <button
          type="button"
          aria-pressed={state.view === 'week'}
          onClick={() => state.setView('week')}
        >
          {PLANNING.WEEK}
        </button>
        <button
          type="button"
          aria-pressed={state.view === 'day'}
          onClick={() => state.setView('day')}
        >
          {PLANNING.DAY}
        </button>
      </div>
    </div>
  );
}
function PlanningDays({ state }: { readonly state: PlanningState }) {
  return (
    <div className="planning-days" role="group" aria-label={PLANNING.CHOOSE_DAY}>
      {state.days.map((day) => (
        <button
          type="button"
          key={day}
          data-day={day}
          aria-label={`${dayLabel(day)}${day === state.today ? `, ${PLANNING.TODAY}` : ''}`}
          aria-current={day === state.today ? 'date' : undefined}
          aria-pressed={day === state.day}
          onClick={() => state.setDay(day)}
        >
          <small>{weekdayLabel(day, true)}</small>
          <strong>{dateNumber(day)}</strong>
        </button>
      ))}
    </div>
  );
}
