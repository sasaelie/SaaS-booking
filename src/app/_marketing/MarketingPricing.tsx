import { MARKETING as UI } from '../../config/marketing';
import { PUBLIC_SITE } from '../../config/public-site';
import { COMMERCIAL } from '../../config/commercial';
import { PlanCards } from '../_portal/PlanCards';
import { PlanComparison } from '../_portal/PlanComparison';
import { formatMoney } from '../_ui/format-money';
export function MarketingPricing() {
  const annualSaving =
    COMMERCIAL.MONTHLY_CENTS * PUBLIC_SITE.MONTHS_PER_YEAR - COMMERCIAL.ANNUAL_CENTS;
  return (
    <section
      className="marketing-section marketing-container marketing-pricing"
      id="tarifs"
      aria-labelledby="tarifs-titre"
    >
      <div className="marketing-section-heading">
        <p className="marketing-eyebrow">{UI.PRICING_EYEBROW}</p>
        <h2 id="tarifs-titre">{UI.PRICING_TITLE}</h2>
        <p>{UI.PRICING_DESCRIPTION}</p>
      </div>
      <PlanCards />
      <p className="marketing-pricing-note">{UI.PRICING_NOTE}</p>
      <p className="marketing-annual-saving">
        <strong>{formatMoney(annualSaving, 'EUR')}</strong> {UI.YEAR_SAVING}
      </p>
      <div className="portal-panel marketing-comparison">
        <PlanComparison />
      </div>
      <p className="marketing-small-print">{UI.BILLING_NOTE}</p>
    </section>
  );
}
