import type { PlatformOrganization } from '../../core/ports/portal-models';
import { PLATFORM_UI, PORTAL } from '../../config/constants';
import { PortalForm } from './PortalForm';
export function PlatformAccessForms({
  organization,
}: {
  readonly organization: PlatformOrganization;
}) {
  return (
    <details className="portal-details">
      <summary>{PLATFORM_UI.MANAGE_ACCESS}</summary>
      <div className="portal-list">
        <p className="portal-muted">{PLATFORM_UI.GRANT_NOTE}</p>
        <PortalForm
          action="grant-access"
          organizationId={organization.id}
          submitLabel={organization.access.complimentary ? PLATFORM_UI.REVOKE : PLATFORM_UI.GRANT}
          compact
        >
          <input type="hidden" name="value" value={String(!organization.access.complimentary)} />
          <label className="portal-check">
            <input type="checkbox" required />
            {PORTAL.CONFIRM_MANAGEMENT}
          </label>
        </PortalForm>
        <p className="portal-muted">{PLATFORM_UI.SUSPEND_NOTE}</p>
        <PortalForm
          action="suspend"
          organizationId={organization.id}
          submitLabel={organization.access.suspendedAt ? PLATFORM_UI.RESTORE : PLATFORM_UI.SUSPEND}
          compact
        >
          <input type="hidden" name="value" value={String(!organization.access.suspendedAt)} />
          <label className="portal-check">
            <input type="checkbox" required />
            {PORTAL.CONFIRM_MANAGEMENT}
          </label>
        </PortalForm>
      </div>
    </details>
  );
}
