import Link from 'next/link';
import { COMMERCIAL, PLAN_UI } from '../../config/commercial';
import { PLAN_SELECTION as UI } from '../../config/plan-selection';
import type { PlanIntent } from '../../core/validation/plan-selection';
import { planPath } from '../../lib/plan-selection';
import { formatMoney } from '../_ui/format-money';
export function PlanCards({
  organizationId,
  current,
  selected,
}: {
  readonly organizationId?: string;
  readonly current?: PlanIntent;
  readonly selected?: PlanIntent | null;
}) {
  const path = organizationId ? `/app/${organizationId}/abonnement` : '/inscription';
  return (
    <div className="portal-cards commercial-plan-grid">
      {(['liberte', 'pro'] as const).map((plan) => (
        <PlanCard
          key={plan}
          plan={plan}
          current={current === plan}
          selected={selected === plan}
          href={`${planPath(path, plan)}${organizationId ? '#choix-formule' : ''}`}
        />
      ))}
    </div>
  );
}
function PlanCard({
  plan,
  current,
  selected,
  href,
}: {
  readonly plan: PlanIntent;
  readonly current: boolean;
  readonly selected: boolean;
  readonly href: string;
}) {
  const pro = plan === 'pro';
  return (
    <Link
      className="portal-panel commercial-plan-card"
      href={href}
      aria-current={selected ? 'true' : undefined}
    >
      <span className="ice-sr-only">{pro ? UI.CHOOSE_PRO : UI.CHOOSE_LIBERTE}</span>
      <h2>{pro ? PLAN_UI.PRO : PLAN_UI.LIBERTE}</h2>
      <p className="commercial-price">
        <strong>{formatMoney(pro ? COMMERCIAL.MONTHLY_CENTS : 0, 'EUR')}</strong>
        <span>{UI.PRICE_MONTH}</span>
      </p>
      {pro ? <p className="commercial-annual">{UI.ANNUAL_OPTION}</p> : null}
      <p className="commercial-plan-fees">{pro ? PLAN_UI.FEES : PLAN_UI.COMMISSION}</p>
      <p className="commercial-plan-summary">{pro ? UI.PRO_SUMMARY : UI.LIBERTE_SUMMARY}</p>
      <span className="commercial-plan-action">
        {current ? UI.CURRENT : UI.SELECT}
        <span aria-hidden="true">→</span>
      </span>
    </Link>
  );
}
