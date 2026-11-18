import type { PlatformUsageReport } from '../../core/ports/platform-reporting';
import { PLATFORM_REPORTING as UI } from '../../config/platform-reporting';
import { ORGANIZATION_KIND_LABELS } from '../../config/portal-labels';
import { PortalMetric } from './PortalMetric';
import { PlatformUsageChart } from './PlatformUsageChart';
const metrics = [
  ['organizerCount', UI.ORGANIZERS],
  ['organizationCount', UI.NEW_ORGANIZATIONS],
  ['activeOrganizationCount', UI.ACTIVE_ORGANIZATIONS],
  ['confirmedCount', UI.CONFIRMED],
  ['cancelledCount', UI.CANCELLED],
  ['participantCount', UI.DISTINCT_PARTICIPANTS],
  ['activityCount', UI.ACTIVITIES],
  ['publishedCount', UI.PUBLISHED],
] as const;
const stages = [
  ['registered', UI.REGISTERED],
  ['activity', UI.FIRST_ACTIVITY],
  ['booking', UI.FIRST_BOOKING],
] as const;
export function PlatformUsage({ data }: { readonly data: PlatformUsageReport }) {
  return (
    <>
      <section className="dashboard-overview">
        <div className="portal-metrics administration-usage-metrics">
          {metrics.map(([key, label]) => (
            <PortalMetric key={key} label={label} value={data[key]} />
          ))}
        </div>
      </section>
      <PlatformUsageChart daily={data.daily} />
      <section className="portal-panel administration-cohort">
        <h2>{UI.COHORT}</h2>
        <p className="portal-muted">{UI.COHORT_NOTE}</p>
        <ol>
          {stages.map(([key, label]) => (
            <li key={key}>
              <span>{label}</span>
              <strong>{data.cohort[key]}</strong>
              <meter
                value={data.cohort[key]}
                min={0}
                max={Math.max(1, data.cohort.registered)}
                aria-label={label}
              />
            </li>
          ))}
        </ol>
      </section>
      <UsageKinds kinds={data.kinds} />
      <p className="portal-muted">{UI.USAGE_NOTE}</p>
    </>
  );
}

function UsageKinds({ kinds }: { readonly kinds: PlatformUsageReport['kinds'] }) {
  return (
    <section className="portal-panel administration-kind-breakdown">
      <h2>{UI.BREAKDOWN}</h2>
      <dl>
        {kinds.map(({ kind, count }) => (
          <div key={kind}>
            <dt>
              {ORGANIZATION_KIND_LABELS[kind as keyof typeof ORGANIZATION_KIND_LABELS] ?? kind}
            </dt>
            <dd>{count}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
