import type { PlatformOverview } from '../../../core/ports/portal-models';
import { headers } from 'next/headers';
import { portal } from '../../../composition/portal';
import { PLATFORM_UI } from '../../../config/constants';
import { PortalHeading } from '../../_portal/PortalHeading';
import { PortalError } from '../../_portal/PortalError';
import { PortalMetric } from '../../_portal/PortalMetric';
import { AdministrationSearch } from '../../_portal/AdministrationSearch';
import { PlatformOrganizations } from '../../_portal/PlatformOrganizations';
import { PortalEmpty } from '../../_portal/PortalEmpty';
import { AdministrationPagination } from '../../_portal/AdministrationPagination';
import {
  ADMIN_WORKSPACE,
  type AdministrationSearchParams,
} from '../../../config/administration-workspace';
export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<AdministrationSearchParams>;
}) {
  const filter = await searchParams;
  const services = portal(new Headers(await headers()));
  if (!services.ok) return <PortalError />;
  const result = await services.value.platform.overview(filter);
  if (!result.ok) return <PortalError message={PLATFORM_UI.DENIED} />;
  const data = result.value;
  return (
    <div className="portal-section-stack">
      <PortalHeading
        title={ADMIN_WORKSPACE.ORGANIZATIONS}
        description={ADMIN_WORKSPACE.ORGANIZATION_HINT}
      />
      <PlatformMetrics data={data} />
      {data.deferredJobs ? (
        <p className="portal-notice">
          {PLATFORM_UI.JOBS} : {data.deferredJobs}
        </p>
      ) : null}
      <AdministrationSearch filter={filter} />
      {data.organizations.length ? (
        <PlatformOrganizations organizations={data.organizations} />
      ) : (
        <PortalEmpty title={PLATFORM_UI.EMPTY} />
      )}
      <AdministrationPagination
        page={data.page ?? 1}
        total={data.total}
        path="/plateforme"
        filter={filter}
      />
    </div>
  );
}

function PlatformMetrics({ data }: { readonly data: PlatformOverview }) {
  return (
    <section className="dashboard-overview">
      <div className="portal-metrics">
        <PortalMetric
          label={PLATFORM_UI.ORGANIZATIONS}
          value={data.organizationCount ?? data.total}
          href="/plateforme"
        />
        <PortalMetric
          label={PLATFORM_UI.ACTIVE}
          value={data.activeCount}
          tone="green"
          href="/plateforme?status=ACTIVE"
        />
        <PortalMetric
          label={PLATFORM_UI.OFFERED}
          value={data.complimentaryCount}
          tone="green"
          href="/plateforme?status=COMPLIMENTARY"
        />
        <PortalMetric
          label={PLATFORM_UI.PAST_DUE}
          value={data.pastDueCount}
          tone={data.pastDueCount ? 'orange' : 'neutral'}
          href="/plateforme?status=PAST_DUE"
        />
      </div>
    </section>
  );
}
