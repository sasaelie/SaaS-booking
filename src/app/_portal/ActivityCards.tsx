import { SERVICE } from '../../config/service';
import { StatusBadge } from './StatusBadge';
import Link from 'next/link';
import type { PortalActivity } from '../../core/ports/portal-models';
import { PORTAL, AUDIENCE_LABELS, PAYMENT_LABELS } from '../../config/constants';
import { formatMoney } from '../_ui/format-money';
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
            {activity.isActive ? PORTAL.ACTIVE : PORTAL.ARCHIVED}
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
          <nav className="portal-card-actions" aria-label={activity.name}>
            <Link href={`/app/${organizationId}/activites/${activity.id}`}>{PORTAL.MANAGE} →</Link>
            <Link href={`/app/${organizationId}/reservations?activityId=${activity.id}`}>
              {PORTAL.VIEW_ATTENDEES}
            </Link>
          </nav>
        </article>
      ))}
    </div>
  );
}
