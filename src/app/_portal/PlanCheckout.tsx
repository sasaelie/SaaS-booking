import type { OrganizationSummary } from '../../core/ports/portal-models';
import { MEMBER_ROLES } from '../../config/constants';
import { COMMERCIAL } from '../../config/commercial';
import { PLAN_SELECTION as UI } from '../../config/plan-selection';
import { paymentsEnabled } from '../../config/staging';
import { formatMoney } from '../_ui/format-money';
import { PortalForm } from './PortalForm';
export function PlanCheckout({ organization }: { readonly organization: OrganizationSummary }) {
  const enabled = paymentsEnabled({ PAYMENTS_ENABLED: process.env['PAYMENTS_ENABLED'] });
  return (
    <PortalForm
      action="subscription"
      organizationId={organization.id}
      submitLabel={enabled ? UI.CHECKOUT : UI.CHECKOUT_TEST}
      disabled={
        organization.role !== MEMBER_ROLES.OWNER || Boolean(organization.access.suspendedAt)
      }
      submitDisabled={!enabled}
    >
      <input type="hidden" name="operation" value="checkout" />
      <fieldset className="commercial-periods">
        <legend>{UI.BILLING_INTERVAL}</legend>
        <Period
          interval="month"
          title={UI.MONTHLY}
          price={COMMERCIAL.MONTHLY_CENTS}
          note={UI.MONTHLY_NOTE}
        />
        <Period
          interval="year"
          title={UI.ANNUAL}
          price={COMMERCIAL.ANNUAL_CENTS}
          note={UI.ANNUAL_NOTE}
        />
      </fieldset>
      <p className="portal-muted">{UI.CHECKOUT_NOTE}</p>
    </PortalForm>
  );
}
function Period({
  interval,
  title,
  price,
  note,
}: {
  readonly interval: 'month' | 'year';
  readonly title: string;
  readonly price: number;
  readonly note: string;
}) {
  return (
    <label className="commercial-period">
      <input
        type="radio"
        name="interval"
        value={interval}
        defaultChecked={interval === 'month'}
        required
      />
      <span>
        <strong>
          {title} · {formatMoney(price, 'EUR')}
        </strong>
        <small>{note}</small>
      </span>
    </label>
  );
}
