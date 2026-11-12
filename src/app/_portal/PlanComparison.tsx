import { PLAN_UI } from '../../config/commercial';
import { PLAN_SELECTION as UI } from '../../config/plan-selection';
import { FEATURE_GROUPS, FEATURE_UI, type FeatureRow } from '../../config/plan-features';
export function PlanComparison() {
  return (
    <div className="commercial-plan-details">
      <p className="commercial-price-note">{PLAN_UI.ABSORBED}</p>
      <details className="commercial-comparison">
        <summary>{UI.COMPARE}</summary>
        <div className="feature-comparison-groups">
          {FEATURE_GROUPS.map((group) => (
            <Features key={group.title} title={group.title} rows={group.rows} />
          ))}
          <p className="portal-muted">{FEATURE_UI.TEST_NOTE}</p>
        </div>
      </details>
    </div>
  );
}
function Features({ title, rows }: { readonly title: string; readonly rows: readonly FeatureRow[] }) {
  return (
    <table className="feature-comparison">
      <caption>{title}</caption>
      <thead>
        <tr>
          <th scope="col">{FEATURE_UI.FEATURE}</th>
          <th scope="col">{PLAN_UI.LIBERTE}</th>
          <th scope="col">{PLAN_UI.PRO}</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <FeatureData key={row[0]} row={row} />
        ))}
      </tbody>
    </table>
  );
}
function FeatureData({ row: [label, detail, liberte, pro, liberteState, proState] }: { readonly row: FeatureRow }) {
  return (
    <tr>
      <th scope="row">
        <strong>{label}</strong>
        <small>{detail}</small>
      </th>
      <td data-availability={liberteState}>
        <span aria-hidden="true" className="feature-mobile-label">
          {PLAN_UI.LIBERTE}
        </span>
        {liberte}
      </td>
      <td data-availability={proState}>
        <span aria-hidden="true" className="feature-mobile-label">
          {PLAN_UI.PRO}
        </span>
        {pro}
      </td>
    </tr>
  );
}
