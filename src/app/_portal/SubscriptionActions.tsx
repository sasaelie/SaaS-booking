import type { OrganizationSummary } from '../../core/ports/portal-models';
import { BILLING_UI, MEMBER_ROLES } from '../../config/constants';
import { canUsePro } from '../../core/domain/commercial';
import type { PlanIntent } from '../../core/validation/plan-selection';
import { PlanCheckout } from './PlanCheckout';
import { PortalForm } from './PortalForm';
import { paymentsEnabled } from '../../config/staging';
export function SubscriptionActions({
  organization,
  selected = null,
}: {
  readonly organization: OrganizationSummary;
  readonly selected?: PlanIntent | null;
}) {
  const access = organization.access;
  const active = canUsePro(access, new Date());
  if (access.complimentary) return null;
  return (
    <div className="portal-list">
      {!active && selected === 'pro' ? <PlanCheckout organization={organization} /> : null}
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
      {active && !access.cancelAtPeriodEnd ? (
        <CancelRenewal organization={organization} open={selected === 'liberte'} />
      ) : null}
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
      submitDisabled={!paymentsEnabled({ PAYMENTS_ENABLED: process.env['PAYMENTS_ENABLED'] })}
      compact
    >
      <input type="hidden" name="operation" value={operation} />
      <input type="hidden" name="interval" value={interval} />
    </PortalForm>
  );
}
function CancelRenewal({
  organization,
  open,
}: {
  readonly organization: OrganizationSummary;
  readonly open: boolean;
}) {
  return (
    <details className="portal-details" open={open}>
      <summary>{BILLING_UI.CANCEL}</summary>
      <div>
        <p className="portal-muted">{BILLING_UI.CANCEL_NOTE}</p>
        <PortalForm
          action="subscription"
          organizationId={organization.id}
          submitLabel={BILLING_UI.CANCEL}
          disabled={organization.role !== MEMBER_ROLES.OWNER}
          submitDisabled={!paymentsEnabled({ PAYMENTS_ENABLED: process.env['PAYMENTS_ENABLED'] })}
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
