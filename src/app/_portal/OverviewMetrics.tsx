import Link from 'next/link';
import type { PortalOverview } from '../../core/ports/portal-models';
import { PORTAL } from '../../config/constants';
import { DASHBOARD } from '../../config/dashboard';
import { PortalMetric } from './PortalMetric';
export function OverviewMetrics({ data }: { readonly data: PortalOverview }) {
  const base = `/app/${data.organization.id}`;
  const only = data.activities.length === 1 ? data.activities[0] : undefined;
  return (
    <section aria-label={PORTAL.HOME}>
      <div className="portal-metrics">
        <PortalMetric
          label={PORTAL.ACTIVITY_COUNT}
          value={data.activities.length}
          href={`${base}/activites${only ? '/' + only.id : ''}`}
        />
        <PortalMetric
          label={DASHBOARD.UPCOMING}
          value={data.bookingCount}
          href={`${base}/reservations?status=${DASHBOARD.UPCOMING_STATUS}`}
        />
        <PortalMetric
          label={PORTAL.PROOF_COUNT}
          value={data.pendingProofCount}
          href={`${base}/reservations?status=PROOF_SUBMITTED`}
        />
        <PortalMetric
          label={PORTAL.REFUND_COUNT}
          value={data.pendingRefundCount}
          href={`${base}/reservations?status=${DASHBOARD.REFUND_STATUS}`}
        />
      </div>
      <p className="dashboard-scope portal-muted">{DASHBOARD.SCOPE}</p>
      <p className="dashboard-history portal-muted">
        {data.historicalBookingCount ?? data.bookingCount} {DASHBOARD.HISTORY_TOTAL} · {data.inactiveBookingCount ?? 0}{' '}
        {DASHBOARD.HISTORY_INACTIVE}. <Link href={`${base}/reservations`}>{DASHBOARD.HISTORY}</Link>
      </p>
    </section>
  );
}
