import { headers } from 'next/headers';
import { portal } from '../../../../composition/portal';
import { ADMIN } from '../../../../config/administration';
import { PLATFORM_UI } from '../../../../config/constants';
import { PortalHeading } from '../../../_portal/PortalHeading';
import { PortalError } from '../../../_portal/PortalError';
import { PortalEmpty } from '../../../_portal/PortalEmpty';
import { PlatformOperationMetrics } from '../../../_portal/PlatformOperationMetrics';
import { AdministrationSearch } from '../../../_portal/AdministrationSearch';
import { PlatformOperationCards } from '../../../_portal/PlatformOperationCards';
import { AdministrationPagination } from '../../../_portal/AdministrationPagination';
import type { AdministrationSearchParams } from '../../../../config/administration-workspace';
export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<AdministrationSearchParams>;
}) {
  const filter = await searchParams;
  const services = portal(new Headers(await headers()));
  const result = services.ok ? await services.value.platform.operations(filter) : services;
  if (!result.ok) return <PortalError message={PLATFORM_UI.DENIED} />;
  const data = result.value;
  return (
    <>
      <PortalHeading title={ADMIN.OPERATIONS} description={ADMIN.OPERATIONS_HINT} />
      <PlatformOperationMetrics data={data} filter={filter} />
      <AdministrationSearch filter={filter} mode="operations" />
      {data.entries.length ? (
        <PlatformOperationCards entries={data.entries} />
      ) : (
        <PortalEmpty title={ADMIN.EMPTY_OPERATIONS} />
      )}
      <AdministrationPagination
        page={data.page}
        total={data.total}
        path="/plateforme/operations"
        filter={filter}
      />
    </>
  );
}
