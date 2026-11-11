import type { OrganizationSummary } from '../../core/ports/portal-models';
import { BILLING_UI, MEMBER_ROLES } from '../../config/constants';
import { canUsePro } from '../../core/domain/commercial';
import { PLAN_UI } from '../../config/commercial';
import { PortalForm } from './PortalForm';
import { STAGING, paymentsEnabled } from '../../config/staging';
export function SubscriptionActions({
  organization,
}: {
  readonly organization: OrganizationSummary;
}) {
  const access = organization.access;
  const active = canUsePro(access, new Date());
  if (!paymentsEnabled({ PAYMENTS_ENABLED: process.env['PAYMENTS_ENABLED'] }))
    return <p className="portal-notice">{STAGING.SUBSCRIPTION_NOTE}</p>;
  if (access.complimentary) return null;
  return (
    <div className="portal-list">
      {!active ? <SubscribeButtons organization={organization} /> : null}
      {active && access.cancelAtPeriodEnd ? (
        <SubscriptionButton
          organization={organization}
          operation="reactivate"
          label={BILLING_UI.RESTART_RENEWAL}
        />
      ) : null}
      {access.stripeCustomerId ? (
        <SubscriptionButton
          organization={organization}
          operation="billingPortal"
          label={BILLING_UI.INVOICES}
        />
      ) : null}
      {active && !access.cancelAtPeriodEnd ? <CancelRenewal organization={organization} /> : null}
    </div>
  );
}
function SubscriptionButton({
  organization,
  operation,
  label,
  interval = 'month',
}: {
  readonly organization: OrganizationSummary;
  readonly operation: string;
  readonly label: string;
  readonly interval?: 'month' | 'year';
}) {
  return (
    <PortalForm
      action="subscription"
      organizationId={organization.id}
      submitLabel={label}
      disabled={
        organization.role !== MEMBER_ROLES.OWNER ||
        (operation === 'checkout' && Boolean(organization.access.suspendedAt))
      }
      compact
    >
      <input type="hidden" name="operation" value={operation} />
      <input type="hidden" name="interval" value={interval} />
    </PortalForm>
  );
}
function CancelRenewal({ organization }: { readonly organization: OrganizationSummary }) {
  return (
    <details className="portal-details">
      <summary>{BILLING_UI.CANCEL}</summary>
      <div>
        <p className="portal-muted">{BILLING_UI.CANCEL_NOTE}</p>
        <PortalForm
          action="subscription"
          organizationId={organization.id}
          submitLabel={BILLING_UI.CANCEL}
          disabled={organization.role !== MEMBER_ROLES.OWNER}
          compact
        >
          <input type="hidden" name="operation" value="cancel" />
          <label className="portal-check">
            <input type="checkbox" required />
            {BILLING_UI.CONFIRM_CANCEL}
          </label>
        </PortalForm>
      </div>
    </details>
  );
}

function SubscribeButtons({ organization }: { readonly organization: OrganizationSummary }) {
  return (
    <div className="portal-list">
      <SubscriptionButton
        organization={organization}
        operation="checkout"
        label={PLAN_UI.MONTHLY}
      />
      <SubscriptionButton
        organization={organization}
        operation="checkout"
        label={PLAN_UI.YEARLY}
        interval="year"
      />
      <p className="portal-muted">{PLAN_UI.YEAR_NOTE}</p>
    </div>
  );
}
