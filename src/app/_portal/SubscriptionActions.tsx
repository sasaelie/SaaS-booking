import type { OrganizationSummary } from '../../core/ports/portal-models';
import { BILLING_UI, MEMBER_ROLES } from '../../config/constants';
import { hasCommercialAccess } from '../../core/domain/subscription-access';
import { PortalForm } from './PortalForm';
export function SubscriptionActions({
  organization,
}: {
  readonly organization: OrganizationSummary;
}) {
  const access = organization.access;
  const active = hasCommercialAccess(access, new Date());
  if (access.complimentary) return null;
  return (
    <div className="portal-list">
      {!active ? (
        <SubscriptionButton
          organization={organization}
          operation="checkout"
          label={BILLING_UI.SUBSCRIBE}
        />
      ) : null}
      {active && access.cancelAtPeriodEnd ? (
        <SubscriptionButton
          organization={organization}
          operation="reactivate"
          label={BILLING_UI.RESTART_RENEWAL}
        />
      ) : null}
      <SubscriptionButton
        organization={organization}
        operation="billingPortal"
        label={BILLING_UI.INVOICES}
      />
      {active && !access.cancelAtPeriodEnd ? <CancelRenewal organization={organization} /> : null}
    </div>
  );
}
function SubscriptionButton({
  organization,
  operation,
  label,
}: {
  readonly organization: OrganizationSummary;
  readonly operation: string;
  readonly label: string;
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
