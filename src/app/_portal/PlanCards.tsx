import { COMMERCIAL, PLAN_UI } from '../../config/commercial';
import { formatMoney } from '../_ui/format-money';
export function PlanCards() {
  return (
    <div className="portal-cards commercial-plan-grid">
      <section className="portal-panel">
        <h2>{PLAN_UI.LIBERTE}</h2>
        <p className="portal-price">{PLAN_UI.LIBERTE_PRICE}</p>
        <p>{PLAN_UI.COMMISSION}</p>
        <p className="portal-muted">{PLAN_UI.ABSORBED}</p>
        <PlanFeatures values={PLAN_UI.LIBERTE_FEATURES} />
      </section>
      <section className="portal-panel">
        <h2>{PLAN_UI.PRO}</h2>
        <p className="portal-price">
          {formatMoney(COMMERCIAL.MONTHLY_CENTS, 'EUR')}
          <small>par mois</small>
        </p>
        <p>{formatMoney(COMMERCIAL.ANNUAL_CENTS, 'EUR')} par an</p>
        <p className="portal-muted">{PLAN_UI.FEES}</p>
        <PlanFeatures values={PLAN_UI.PRO_FEATURES} />
      </section>
    </div>
  );
}
function PlanFeatures({ values }: { readonly values: readonly string[] }) {
  return (
    <ul className="portal-feature-list">
      {values.map((text) => (
        <li key={text}>{text}</li>
      ))}
    </ul>
  );
}
