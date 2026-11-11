import type { OrganizationSummary } from '../../core/ports/portal-models';
import { MEMBER_ROLES, BILLING_UI } from '../../config/constants';
import { PLAN_SELECTION as UI } from '../../config/plan-selection';
import { paymentsEnabled } from '../../config/staging';
import { BillingPeriods } from './BillingPeriods';
import { PlanCheckoutPreview } from './PlanCheckoutPreview';
import { BILLING_PREVIEW } from '../../config/billing-preview';
import { PortalForm } from './PortalForm';
export function PlanCheckout({ organization }: { readonly organization: OrganizationSummary }) {
  const enabled = paymentsEnabled({ PAYMENTS_ENABLED: process.env['PAYMENTS_ENABLED'] });
  const disabled =
    organization.role !== MEMBER_ROLES.OWNER || Boolean(organization.access.suspendedAt);
  if (enabled && organization.access.complimentary)
    return <p className="portal-notice">{BILLING_UI.OFFERED_NOTE}</p>;
  if (!enabled)
    return (
      <PlanCheckoutPreview offered={organization.access.complimentary} disabled={disabled}>
        <BillingPeriods />
      </PlanCheckoutPreview>
    );
  return (
    <PortalForm
      action="subscription"
      organizationId={organization.id}
      submitLabel={UI.CHECKOUT}
      disabled={disabled}
    >
      <input type="hidden" name="operation" value="checkout" />
      <BillingPeriods />
      <p className="portal-muted">{BILLING_PREVIEW.LIVE}</p>
    </PortalForm>
  );
}
