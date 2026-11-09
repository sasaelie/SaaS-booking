import { PAYMENT_FILTERS } from '../../config/service';
import { PORTAL, BOOKING_STATUS_LABELS } from '../../config/constants';
import { PortalField } from './PortalField';
import { PortalSelect } from './PortalSelect';
export function BookingFilters({
  search,
  status,
  activityId = '',
  activities = [],
}: {
  readonly search: string;
  readonly status: string;
  readonly activityId?: string;
  readonly activities?: readonly { readonly id: string; readonly name: string }[];
}) {
  return (
    <form className="portal-filters" method="get">
      <PortalSelect label={PORTAL.ACTIVITY} name="activityId" defaultValue={activityId}>
        <option value="">{PORTAL.ALL_ACTIVITIES}</option>
        {activities.map((activity) => (
          <option value={activity.id} key={activity.id}>
            {activity.name}
          </option>
        ))}
      </PortalSelect>
      <PortalField label={PORTAL.SEARCH} name="search" defaultValue={search} />
      <PortalSelect label={PORTAL.STATUS} name="status" defaultValue={status}>
        <option value="">{PORTAL.ALL_STATUSES}</option>
        {Object.entries({ ...BOOKING_STATUS_LABELS, ...PAYMENT_FILTERS }).map(([value, label]) => (
          <option value={value} key={value}>
            {label}
          </option>
        ))}
      </PortalSelect>
      <button className="liquid-ice-button portal-button">{PORTAL.FILTER}</button>
    </form>
  );
}
