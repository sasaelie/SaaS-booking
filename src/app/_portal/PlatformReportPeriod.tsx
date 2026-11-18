import type { PlatformReportFilter } from '../../core/validation/platform-reporting';
import { PLATFORM_REPORTING as UI } from '../../config/platform-reporting';
import { PortalField } from './PortalField';
import { PortalSelect } from './PortalSelect';
export function PlatformReportPeriod({
  filter,
  finance = false,
}: {
  readonly filter: PlatformReportFilter;
  readonly finance?: boolean;
}) {
  return (
    <form method="get" className="administration-period">
      <input type="hidden" name="view" value={filter.view} />
      {filter.organizationId ? (
        <input type="hidden" name="organizationId" value={filter.organizationId} />
      ) : null}
      <PortalField label={UI.FROM} name="from" type="date" defaultValue={filter.from} required />
      <PortalField label={UI.TO} name="to" type="date" defaultValue={filter.to} required />
      {finance ? <FinanceFilters filter={filter} /> : null}
      <button className="liquid-ice-button portal-button">{UI.APPLY}</button>
    </form>
  );
}
function FinanceFilters({ filter }: { readonly filter: PlatformReportFilter }) {
  return (
    <>
      <PortalField label={UI.ORGANIZER} name="search" defaultValue={filter.search} />
      {filter.view === 'rapprochements' ? (
        <PortalSelect label={UI.KIND} name="status" defaultValue={filter.status}>
          <option value="">{UI.ALL}</option>
          <option value="PENDING">{UI.PENDING}</option>
          <option value="RECONCILED">{UI.RECONCILED}</option>
          <option value="HISTORICAL">{UI.HISTORICAL}</option>
        </PortalSelect>
      ) : (
        <PortalSelect label={UI.SCOPE} name="scope" defaultValue={filter.scope}>
          <option value="">{UI.ALL}</option>
          <option value="PLATFORM">{UI.PLATFORM}</option>
          <option value="ORGANIZER">{UI.ORGANIZER}</option>
          <option value="CREDIT">{UI.CREDIT}</option>
        </PortalSelect>
      )}
    </>
  );
}
