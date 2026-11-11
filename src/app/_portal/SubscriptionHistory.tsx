import type { OrganizationSummary } from '../../core/ports/portal-models';
import { BILLING_UI } from '../../config/constants';
import { PLAN_UI } from '../../config/commercial';
import { portalDate } from './date-label';
export function SubscriptionHistory({
  organization,
  active,
}: {
  readonly organization: OrganizationSummary;
  readonly active: boolean;
}) {
  const access = organization.access;
  return (
    <>
      {active ? (
        <>
          <a
            className="liquid-ice-button portal-button"
            href={`/api/portal/accounting?organizationId=${organization.id}`}
          >
            {PLAN_UI.EXPORT}
          </a>
          <p className="portal-muted">{PLAN_UI.EXPORT_NOTE}</p>
        </>
      ) : null}
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
      {!active && !access.complimentary && access.currentPeriodEnd ? (
        <p className="portal-muted">{BILLING_UI.EXPIRED_NOTE}</p>
      ) : null}
    </>
  );
}
