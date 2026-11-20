import { PLAN_UI } from '../../config/commercial';
import { SERVICE } from '../../config/service';
import { StatusBadge } from './StatusBadge';
import { AppLink as Link } from '../_ui/AppLink';
import type { PortalActivity } from '../../core/ports/portal-models';
import { PORTAL, AUDIENCE_LABELS, PAYMENT_LABELS } from '../../config/constants';
import { formatMoney } from '../_ui/format-money';
import { IceIcon } from '../_ui/IceIcon';
export function ActivityCards({
  activities,
  organizationId,
}: {
  readonly activities: readonly PortalActivity[];
  readonly organizationId: string;
}) {
  return (
    <div className="portal-cards">
      {activities.map((activity) => (
        <article className="portal-panel portal-organization-card" key={activity.id}>
          <span className="portal-badge" data-muted={!activity.isActive}>
            {activity.isActive
              ? activity.reservationsOpen === false
                ? PLAN_UI.VIEW_ONLY
                : PORTAL.ACTIVE
              : PORTAL.ARCHIVED}
          </span>
          {activity.addressVisibility === 'REMINDER' && !activity.address ? (
            <StatusBadge status={{ tone: 'orange', label: SERVICE.MISSING_ADDRESS }} />
          ) : null}
          <h2>{activity.name}</h2>
          <strong>{formatMoney(activity.priceCents, activity.currency)}</strong>
          <div className="portal-activity-meta">
            <span>{AUDIENCE_LABELS[activity.audiencePolicy]}</span>
            <span>{PAYMENT_LABELS[activity.paymentMode]}</span>
          </div>
          <ActivityActions activity={activity} organizationId={organizationId} />
        </article>
      ))}
    </div>
  );
}

function ActivityActions({
  activity,
  organizationId,
}: {
  readonly activity: PortalActivity;
  readonly organizationId: string;
}) {
  return (
    <nav className="portal-card-actions" aria-label={activity.name}>
      <Link
        className="portal-secondary-action"
        href={`/app/${organizationId}/activites/${activity.id}`}
      >
        {PORTAL.MANAGE}
        <IceIcon name="arrow" />
      </Link>
      <Link
        className="portal-secondary-action"
        href={`/app/${organizationId}/reservations?activityId=${activity.id}`}
      >
        {PORTAL.VIEW_ATTENDEES}
      </Link>
    </nav>
  );
}
