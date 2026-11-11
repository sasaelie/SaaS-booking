import { PLAN_UI } from '../../config/commercial';
import { PLAN_SELECTION as UI } from '../../config/plan-selection';
export function PlanComparison() {
  return (
    <div className="commercial-plan-details">
      <p className="commercial-price-note">{PLAN_UI.ABSORBED}</p>
      <details className="commercial-comparison">
        <summary>{UI.COMPARE}</summary>
        <div className="commercial-comparison-grid">
          <Features title={PLAN_UI.LIBERTE} values={PLAN_UI.LIBERTE_FEATURES} />
          <Features title={PLAN_UI.PRO} values={PLAN_UI.PRO_FEATURES} />
        </div>
      </details>
    </div>
  );
}
function Features({
  title,
  values,
}: {
  readonly title: string;
  readonly values: readonly string[];
}) {
  return (
    <section>
      <h3>{title}</h3>
      <ul>
        {values.map((text) => (
          <li key={text}>{text}</li>
        ))}
      </ul>
    </section>
  );
}
