import { headers } from 'next/headers';
import { portal } from '../../../../composition/portal';
import { ADMIN_WORKSPACE } from '../../../../config/administration-workspace';
import {
  PLATFORM_REPORTING as UI,
  type PlatformReportSearch,
} from '../../../../config/platform-reporting';
import { PortalHeading } from '../../../_portal/PortalHeading';
import { PortalError } from '../../../_portal/PortalError';
import { PlatformReportPeriod } from '../../../_portal/PlatformReportPeriod';
import { PlatformUsage } from '../../../_portal/PlatformUsage';
export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<PlatformReportSearch>;
}) {
  const app = portal(new Headers(await headers()));
  const result = app.ok ? await app.value.reporting.usage(await searchParams) : app;
  if (!result.ok) return <PortalError />;
  return (
    <>
      <PortalHeading title={ADMIN_WORKSPACE.USAGE} description={UI.USAGE_HINT} />
      <PlatformReportPeriod filter={result.value.filter} />
      <PlatformUsage data={result.value} />
    </>
  );
}
