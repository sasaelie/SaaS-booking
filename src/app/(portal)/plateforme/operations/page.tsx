import { headers } from 'next/headers';
import { portal } from '../../../../composition/portal';
import { ADMIN } from '../../../../config/administration';
import { PLATFORM_UI } from '../../../../config/constants';
import { PortalHeading } from '../../../_portal/PortalHeading';
import { PortalError } from '../../../_portal/PortalError';
import { PortalEmpty } from '../../../_portal/PortalEmpty';
import { PortalMetric } from '../../../_portal/PortalMetric';
import { AdministrationSearch } from '../../../_portal/AdministrationSearch';
import { PlatformOperationCards } from '../../../_portal/PlatformOperationCards';
import { Pagination } from '../../../_portal/Pagination';
export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const filter = await searchParams;
  const services = portal(new Headers(await headers()));
  const result = services.ok ? await services.value.platform.operations(filter) : services;
  if (!result.ok) return <PortalError message={PLATFORM_UI.DENIED} />;
  const data = result.value;
  return (
    <>
      <PortalHeading title={ADMIN.OPERATIONS} description={ADMIN.OPERATIONS_HINT} />
      <div className="portal-metrics">
        <PortalMetric label={ADMIN.PENDING_COUNT} value={data.total} />
        <PortalMetric label={ADMIN.FAILED_COUNT} value={data.failedCount} />
      </div>
      <AdministrationSearch search={filter.search} />
      {data.entries.length ? (
        <PlatformOperationCards entries={data.entries} />
      ) : (
        <PortalEmpty title={ADMIN.EMPTY_OPERATIONS} />
      )}
      <Pagination
        page={data.page}
        total={data.total}
        path="/plateforme/operations"
        search={filter.search}
      />
    </>
  );
}
