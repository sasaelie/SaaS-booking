import { accessLabel } from './access-label';
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
    <section className="portal-panel portal-table-wrap">
      <table className="portal-table">
        <thead>
          <tr>
            <th>{PLATFORM_UI.ORGANIZATIONS}</th>
            <th>{PLATFORM_UI.OWNER}</th>
            <th>{PLATFORM_UI.ACCESS}</th>
            <th>{PLATFORM_UI.ACTIVITIES}</th>
            <th>{PLATFORM_UI.BOOKINGS}</th>
          </tr>
        </thead>
        <tbody>
          {organizations.map((organization) => (
            <PlatformRow key={organization.id} organization={organization} />
          ))}
        </tbody>
      </table>
    </section>
  );
}

function PlatformRow({ organization }: { readonly organization: PlatformOrganization }) {
  return (
    <tr key={organization.id}>
      <td>
        <strong>{organization.name}</strong>
        <small>/{organization.slug}</small>
        <small>{portalDate(organization.createdAt)}</small>
      </td>
      <td>{organization.ownerEmail ?? '—'}</td>
      <td>
        <span className="portal-badge">{accessLabel(organization.access)}</span>
        <PlatformAccessForms organization={organization} />
      </td>
      <td>{organization.activityCount}</td>
      <td>{organization.bookingCount}</td>
    </tr>
  );
}
