import type { OrganizationSummary } from '../../core/ports/portal-models';
import { SETTINGS_UI, PORTAL, MEMBER_ROLES } from '../../config/constants';
import { PortalForm } from './PortalForm';
import { STAGING, paymentsEnabled } from '../../config/staging';
export function ConnectSettings({
  organization,
  operator,
}: {
  readonly organization: OrganizationSummary;
  readonly operator: boolean;
}) {
  const owner = organization.role === MEMBER_ROLES.OWNER;
  if (!paymentsEnabled({ PAYMENTS_ENABLED: process.env['PAYMENTS_ENABLED'] }))
    return (
      <section className="portal-panel">
        <h2>{SETTINGS_UI.STRIPE}</h2>
        <p className="portal-notice">{STAGING.PAYMENT_NOTE}</p>
      </section>
    );
  return (
    <section className="portal-panel">
      <h2>{SETTINGS_UI.STRIPE}</h2>
      <p className="portal-muted">{SETTINGS_UI.STRIPE_HINT}</p>
      {organization.stripeReady ? (
        <p className="portal-badge">{SETTINGS_UI.STRIPE_CONNECTED}</p>
      ) : organization.merchantAccountId ? (
        <p className="portal-notice">{SETTINGS_UI.STRIPE_PENDING}</p>
      ) : null}
      <PortalForm
        action="connect-stripe"
        organizationId={organization.id}
        submitLabel={SETTINGS_UI.STRIPE_CONNECT}
        disabled={!owner}
        compact
      />
      {operator && owner ? <OwnAccountSettings organizationId={organization.id} /> : null}
    </section>
  );
}

function OwnAccountSettings({ organizationId }: { readonly organizationId: string }) {
  return (
    <details className="portal-details">
      <summary>{SETTINGS_UI.PLATFORM_PAYMENTS}</summary>
      <div>
        <p className="portal-muted">{SETTINGS_UI.PLATFORM_PAYMENTS_NOTE}</p>
        <PortalForm
          action="platform-stripe"
          organizationId={organizationId}
          submitLabel={SETTINGS_UI.PLATFORM_PAYMENTS}
          compact
        >
          <label className="portal-check">
            <input type="checkbox" required />
            {PORTAL.CONFIRM_MANAGEMENT}
          </label>
        </PortalForm>
      </div>
    </details>
  );
}
