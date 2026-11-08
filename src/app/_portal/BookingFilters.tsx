import { PORTAL, BOOKING_STATUS_LABELS } from '../../config/constants';
import { PortalField } from './PortalField';
import { PortalSelect } from './PortalSelect';
export function BookingFilters({
  search,
  status,
}: {
  readonly search: string;
  readonly status: string;
}) {
  return (
    <form className="portal-filters" method="get">
      <PortalField label={PORTAL.SEARCH} name="search" defaultValue={search} />
      <PortalSelect label={PORTAL.STATUS} name="status" defaultValue={status}>
        <option value="">{PORTAL.ALL_STATUSES}</option>
        {Object.entries(BOOKING_STATUS_LABELS).map(([value, label]) => (
          <option value={value} key={value}>
            {label}
          </option>
        ))}
      </PortalSelect>
      <button className="liquid-ice-button portal-button">{PORTAL.FILTER}</button>
    </form>
  );
}
