import { accessLabel } from './access-label';
import type { OrganizationSummary } from '../../core/ports/portal-models';
import { BILLING_UI, SAAS } from '../../config/constants';
import { hasCommercialAccess } from '../../core/domain/subscription-access';
import { formatMoney } from '../_ui/format-money';
import { portalDate } from './date-label';
import { SubscriptionActions } from './SubscriptionActions';
export function SubscriptionPanel({
  organization,
}: {
  readonly organization: OrganizationSummary;
}) {
  const access = organization.access;
  const active = hasCommercialAccess(access, new Date());
  const status = accessLabel(access);
  return (
    <div className="portal-cards">
      <SubscriptionPrice status={status} />
      <section className="portal-panel">
        <h2>{BILLING_UI.STATUS}</h2>
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

function SubscriptionPrice({ status }: { readonly status: string }) {
  return (
    <section className="portal-panel">
      <span className="portal-badge">{status}</span>
      <h2>{BILLING_UI.PRICE_HEADING}</h2>
      <div className="portal-price">
        {formatMoney(SAAS.MONTHLY_CENTS, SAAS.CURRENCY)}
        <small>{BILLING_UI.PER_MONTH}</small>
      </div>
      <p>{BILLING_UI.NO_COMMISSION}</p>
      <p className="portal-muted">{BILLING_UI.PROVIDER_FEES}</p>
      <ul className="portal-feature-list">
        {BILLING_UI.FEATURES.map((feature) => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
    </section>
  );
}
