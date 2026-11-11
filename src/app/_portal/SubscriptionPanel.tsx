import { accessLabel } from './access-label';
import type { OrganizationSummary } from '../../core/ports/portal-models';
import { BILLING_UI } from '../../config/constants';
import { canUsePro } from '../../core/domain/commercial';
import { PlanCards } from './PlanCards';
import { PLAN_UI } from '../../config/commercial';
import { portalDate } from './date-label';
import { SubscriptionActions } from './SubscriptionActions';
export function SubscriptionPanel({
  organization,
}: {
  readonly organization: OrganizationSummary;
}) {
  const access = organization.access;
  const active = canUsePro(access, new Date());
  return (
    <div className="portal-list">
      <PlanCards />
      <section className="portal-panel">
        <h2>{BILLING_UI.STATUS}</h2>
        <span className="portal-badge">{active ? accessLabel(access) : PLAN_UI.LIBERTE}</span>
        {active ? (
          <a
            className="liquid-ice-button portal-button"
            href={`/api/portal/accounting?organizationId=${organization.id}`}
          >
            {PLAN_UI.EXPORT}
          </a>
        ) : null}
        <p className="portal-muted">{PLAN_UI.EXPORT_NOTE}</p>
        {access.complimentary ? <p className="portal-notice">{BILLING_UI.OFFERED_NOTE}</p> : null}
        {access.currentPeriodEnd ? (
          <div className="portal-state-line">
            <span>{BILLING_UI.PAID_UNTIL}</span>
            <strong>{portalDate(access.currentPeriodEnd, organization.timezone)}</strong>
          </div>
        ) : null}
        {access.cancelAtPeriodEnd && active ? (
          <p className="portal-notice">{BILLING_UI.CANCEL_NOTE}</p>
        ) : null}
        {!active && !access.complimentary ? (
          <p className="portal-muted">{BILLING_UI.EXPIRED_NOTE}</p>
        ) : null}
        <SubscriptionActions organization={organization} />
      </section>
    </div>
  );
}
