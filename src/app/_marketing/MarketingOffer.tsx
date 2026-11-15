import Link from 'next/link';
import { COMMERCIAL, PLAN_UI } from '../../config/commercial';
import { MARKETING_OFFERS as UI } from '../../config/marketing-offers';
import { PLAN_SELECTION } from '../../config/plan-selection';
import { DEFAULTS, MONEY } from '../../config/constants';
import type { PlanIntent } from '../../core/validation/plan-selection';
import { planPath } from '../../lib/plan-selection';
import { IceIcon } from '../_ui/IceIcon';
export function MarketingOffer({ plan }: { readonly plan: PlanIntent }) {
  const pro = plan === 'pro';
  return (
    <article className="marketing-offer">
      <span className="marketing-offer-icon">
        <IceIcon name={pro ? 'calendar' : 'ticket'} />
      </span>
      <h3>{pro ? PLAN_UI.PRO : PLAN_UI.LIBERTE}</h3>
      <p className="marketing-offer-price">
        <strong>{planAmount(pro ? COMMERCIAL.MONTHLY_CENTS : 0)}</strong>
        <span>{UI.MONTH}</span>
      </p>
      {pro ? (
        <p className="marketing-offer-annual">
          {UI.YEAR_PREFIX} {planAmount(COMMERCIAL.ANNUAL_CENTS)} {UI.YEAR}
        </p>
      ) : null}
      <p className="marketing-offer-description">
        {pro ? UI.PRO_DESCRIPTION : UI.LIBERTE_DESCRIPTION}
      </p>
      {!pro ? <p className="marketing-offer-summary">{UI.LIBERTE_SUMMARY}</p> : null}
      <p className="marketing-offer-fees">{pro ? UI.PRO_FEES : PLAN_UI.COMMISSION}</p>
      <Link
        className="marketing-text-link"
        href={planPath('/inscription', plan)}
        aria-label={pro ? PLAN_SELECTION.CHOOSE_PRO : PLAN_SELECTION.CHOOSE_LIBERTE}
      >
        {pro ? UI.CHOOSE_PRO : UI.CHOOSE_LIBERTE}
        <IceIcon name="arrow" />
      </Link>
    </article>
  );
}
function planAmount(cents: number) {
  return new Intl.NumberFormat(DEFAULTS.LOCALE, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / MONEY.CENTS_PER_UNIT);
}
