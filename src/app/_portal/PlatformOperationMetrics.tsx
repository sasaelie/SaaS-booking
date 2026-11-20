import type { PlatformOperationsPage } from '../../core/ports/platform-monitoring';
import { PortalMetric } from './PortalMetric';
import type { AdministrationSearchParams } from '../../config/administration-workspace';
import { ADMIN } from '../../config/administration';
export function PlatformOperationMetrics({
  data,
  filter,
}: {
  readonly data: PlatformOperationsPage;
  readonly filter: AdministrationSearchParams;
}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filter))
    if (value && key !== 'page' && key !== 'status') query.set(key, value);
  const pendingHref = `/plateforme/operations?${query}`;
  query.set('status', 'RETRY');
  return (
    <section className="dashboard-overview">
      <div className="portal-metrics administration-operation-metrics">
        <PortalMetric
          label={ADMIN.PENDING_COUNT}
          value={data.pendingCount ?? data.total}
          tone={data.pendingCount || data.total ? 'orange' : 'neutral'}
          href={pendingHref}
        />
        <PortalMetric
          label={ADMIN.FAILED_COUNT}
          value={data.failedCount}
          tone={data.failedCount ? 'red' : 'neutral'}
          href={`/plateforme/operations?${query}`}
        />
      </div>
    </section>
  );
}
