import { headers } from 'next/headers';
import { portal } from '../../../../composition/portal';
import { ADMIN } from '../../../../config/administration';
import { PLATFORM_UI } from '../../../../config/constants';
import { PortalHeading } from '../../../_portal/PortalHeading';
import { PortalError } from '../../../_portal/PortalError';
import { PortalEmpty } from '../../../_portal/PortalEmpty';
import { AdministrationSearch } from '../../../_portal/AdministrationSearch';
import { PlatformHistoryCards } from '../../../_portal/PlatformHistoryCards';
import { AdministrationPagination } from '../../../_portal/AdministrationPagination';
import type { AdministrationSearchParams } from '../../../../config/administration-workspace';
export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<AdministrationSearchParams>;
}) {
  const filter = await searchParams;
  const services = portal(new Headers(await headers()));
  const result = services.ok ? await services.value.platform.history(filter) : services;
  if (!result.ok) return <PortalError message={PLATFORM_UI.DENIED} />;
  const data = result.value;
  return (
    <>
      <PortalHeading title={ADMIN.HISTORY} description={ADMIN.HISTORY_HINT} />
      <AdministrationSearch filter={filter} mode="history" />
      {data.entries.length ? (
        <PlatformHistoryCards entries={data.entries} />
      ) : (
        <PortalEmpty title={ADMIN.EMPTY_HISTORY} />
      )}
      <AdministrationPagination
        page={data.page}
        total={data.total}
        path="/plateforme/historique"
        filter={filter}
      />
    </>
  );
}
