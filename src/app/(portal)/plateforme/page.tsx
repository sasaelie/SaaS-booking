import type { PlatformOverview } from '../../../core/ports/portal-models';
import { headers } from 'next/headers';
import { portal } from '../../../composition/portal';
import { PLATFORM_UI, PORTAL } from '../../../config/constants';
import { PortalHeading } from '../../_portal/PortalHeading';
import { PortalError } from '../../_portal/PortalError';
import { PortalMetric } from '../../_portal/PortalMetric';
import { PortalField } from '../../_portal/PortalField';
import { PlatformOrganizations } from '../../_portal/PlatformOrganizations';
import { PortalEmpty } from '../../_portal/PortalEmpty';
import { Pagination } from '../../_portal/Pagination';
export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const filter = await searchParams;
  const services = portal(new Headers(await headers()));
  if (!services.ok) return <PortalError />;
  const result = await services.value.platform.overview(filter);
  if (!result.ok) return <PortalError message={PLATFORM_UI.DENIED} />;
  const data = result.value;
  return (
    <>
      <PortalHeading title={PLATFORM_UI.TITLE} description={PLATFORM_UI.INTRO} />
      <PlatformMetrics data={data} />
      {data.deferredJobs ? (
        <p className="portal-notice">
          {PLATFORM_UI.JOBS} : {data.deferredJobs}
        </p>
      ) : null}
      <form className="portal-filters" method="get">
        <PortalField label={PLATFORM_UI.SEARCH} name="search" defaultValue={filter.search ?? ''} />
        <button className="liquid-ice-button portal-button">{PORTAL.SEARCH}</button>
      </form>
      {data.organizations.length ? (
        <PlatformOrganizations organizations={data.organizations} />
      ) : (
        <PortalEmpty title={PLATFORM_UI.EMPTY} />
      )}
      <Pagination
        page={Number(filter.page) || 1}
        total={data.total}
        path="/plateforme"
        search={filter.search}
      />
    </>
  );
}

function PlatformMetrics({ data }: { readonly data: PlatformOverview }) {
  return (
    <div className="portal-metrics">
      <PortalMetric label={PLATFORM_UI.ORGANIZATIONS} value={data.total} />
      <PortalMetric label={PLATFORM_UI.ACTIVE} value={data.activeCount} />
      <PortalMetric label={PLATFORM_UI.OFFERED} value={data.complimentaryCount} />
      <PortalMetric label={PLATFORM_UI.PAST_DUE} value={data.pastDueCount} />
    </div>
  );
}
