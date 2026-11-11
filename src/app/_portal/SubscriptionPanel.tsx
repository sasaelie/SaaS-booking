import { accessLabel } from './access-label';
import type { OrganizationSummary } from '../../core/ports/portal-models';
import { BILLING_UI, MEMBER_ROLES } from '../../config/constants';
import { canUsePro } from '../../core/domain/commercial';
import { PlanCards } from './PlanCards';
import { PLAN_UI } from '../../config/commercial';
import { SubscriptionHistory } from './SubscriptionHistory';
import { SubscriptionActions } from './SubscriptionActions';
import { PlanComparison } from './PlanComparison';
import type { PlanIntent } from '../../core/validation/plan-selection';
import { PLAN_SELECTION as UI } from '../../config/plan-selection';
import { STAGING, paymentsEnabled } from '../../config/staging';
export function SubscriptionPanel({
  organization,
  selected = null,
}: {
  readonly organization: OrganizationSummary;
  readonly selected?: PlanIntent | null;
}) {
  const access = organization.access;
  const active = canUsePro(access, new Date());
  return (
    <div className="portal-list">
      <div>
        <PlanCards
          organizationId={organization.id}
          current={active ? 'pro' : 'liberte'}
          selected={selected}
        />
        <PlanComparison />
      </div>
      <section className="portal-panel" id="choix-formule">
        <h2>{BILLING_UI.STATUS}</h2>
        <span className="portal-badge">{active ? accessLabel(access) : PLAN_UI.LIBERTE}</span>
        <PlanChoiceSummary selected={selected} active={active} offered={access.complimentary} />
        {organization.role !== MEMBER_ROLES.OWNER ? (
          <p className="portal-notice">{UI.OWNER_ONLY}</p>
        ) : null}
        <SubscriptionHistory organization={organization} active={active} />
        {!paymentsEnabled({ PAYMENTS_ENABLED: process.env['PAYMENTS_ENABLED'] }) ? (
          <p className="portal-notice">{STAGING.SUBSCRIPTION_NOTE}</p>
        ) : null}
        <SubscriptionActions organization={organization} selected={selected} />
      </section>
    </div>
  );
}
function PlanChoiceSummary({
  selected,
  active,
  offered,
}: {
  readonly selected: PlanIntent | null;
  readonly active: boolean;
  readonly offered: boolean;
}) {
  if (offered && selected === 'liberte') return <p className="portal-muted">{UI.OFFERED_PLAN}</p>;
  return (
    <>
      {selected ? <p className="commercial-intent-note">{UI.CHOICE[selected]}</p> : null}
      {selected === 'liberte' ? (
        <p className="portal-muted">{active ? UI.LIBERTE_RETURN : UI.FREE_ACTIVE}</p>
      ) : null}
      {selected !== 'liberte' && (active || !selected) ? (
        <p className="portal-muted">{active ? UI.PRO_ACTIVE : UI.FREE_ACTIVE}</p>
      ) : null}
    </>
  );
}
