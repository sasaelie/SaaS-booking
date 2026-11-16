import { PLANNING } from '../../config/planning';
import { dayLabel, monthLabel, monthOf } from '../_ui/calendar-dates';
import { PlanningViews } from './PlanningViews';
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
          <strong aria-live="polite">
            {state.view === 'month' ? monthLabel(monthOf(state.day)) : weekLabel(state.day)}
          </strong>
          <small>{timezone}</small>
        </div>
        <PlanningControls state={state} />
      </div>
      {state.view !== 'month' ? <PlanningDays state={state} /> : null}
    </>
  );
}
function PlanningControls({ state }: { readonly state: PlanningState }) {
  return (
    <div className="planning-controls">
      <button
        type="button"
        aria-label={state.view === 'month' ? PLANNING.PREVIOUS_MONTH : PLANNING.PREVIOUS}
        disabled={!state.previous}
        onClick={() => state.move(-1)}
      >
        ←
      </button>
      <button
        type="button"
        aria-label={state.view === 'month' ? PLANNING.NEXT_MONTH : PLANNING.NEXT}
        disabled={!state.next}
        onClick={() => state.move(1)}
      >
        →
      </button>
      <PlanningViews state={state} />
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
