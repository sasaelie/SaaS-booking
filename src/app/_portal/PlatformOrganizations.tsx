import { accessIndicator } from '../../core/domain/status-indicator';
import { StatusBadge } from './StatusBadge';
import type { PlatformOrganization } from '../../core/ports/portal-models';
import { PLATFORM_UI } from '../../config/constants';
import { PlatformAccessForms } from './PlatformAccessForms';
import { portalDate } from './date-label';
export function PlatformOrganizations({
  organizations,
}: {
  readonly organizations: readonly PlatformOrganization[];
}) {
  return (
    <div className="administration-organizations">
      {organizations.map((organization) => (
        <OrganizationCard key={organization.id} organization={organization} />
      ))}
    </div>
  );
}
function OrganizationCard({ organization }: { readonly organization: PlatformOrganization }) {
  return (
    <article className="portal-panel administration-entry">
      <div className="administration-entry-heading">
        <h2>{organization.name}</h2>
        <StatusBadge status={accessIndicator(organization.access)} />
      </div>
      <p className="portal-muted">/{organization.slug}</p>
      <dl>
        <dt>{PLATFORM_UI.OWNER}</dt>
        <dd>{organization.ownerEmail ?? '—'}</dd>
        <dt>{PLATFORM_UI.CREATED}</dt>
        <dd>{portalDate(organization.createdAt)}</dd>
        <dt>{PLATFORM_UI.ACTIVITIES}</dt>
        <dd>{organization.activityCount}</dd>
        <dt>{PLATFORM_UI.BOOKINGS}</dt>
        <dd>{organization.bookingCount}</dd>
      </dl>
      <PlatformAccessForms organization={organization} />
    </article>
  );
}
