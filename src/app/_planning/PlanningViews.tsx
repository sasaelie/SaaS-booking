import { PLANNING } from '../../config/planning';
import type { PlanningState } from './use-planning';
export function PlanningViews({ state }: { readonly state: PlanningState }) {
  return (
    <>
      <select
        className="planning-mobile-view"
        aria-label={PLANNING.VIEW}
        value={state.view}
        onChange={(event) => {
          const view = event.target.value;
          if (view === 'week' || view === 'day' || view === 'month') state.setView(view);
        }}
      >
        <option value="week">{PLANNING.WEEK}</option>
        <option value="day">{PLANNING.DAY}</option>
        <option value="month">{PLANNING.MONTH}</option>
      </select>
      <div className="planning-modes" role="group" aria-label={PLANNING.VIEW}>
        {(['week', 'day', 'month'] as const).map((view) => (
          <button
            key={view}
            type="button"
            aria-pressed={state.view === view}
            onClick={() => state.setView(view)}
          >
            {view === 'week' ? PLANNING.WEEK : view === 'day' ? PLANNING.DAY : PLANNING.MONTH}
          </button>
        ))}
      </div>
    </>
  );
}
