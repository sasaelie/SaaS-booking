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
          <h2>{activity.name}</h2>
          <strong>{formatMoney(activity.priceCents, activity.currency)}</strong>
          <div className="portal-activity-meta">
            <span>{AUDIENCE_LABELS[activity.audiencePolicy]}</span>
            <span>{PAYMENT_LABELS[activity.paymentMode]}</span>
          </div>
          <Link href={`/app/${organizationId}/activites/${activity.id}`}>{PORTAL.MANAGE} →</Link>
        </article>
      ))}
    </div>
  );
}
