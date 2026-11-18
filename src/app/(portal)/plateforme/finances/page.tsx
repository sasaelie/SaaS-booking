import type { PlatformFinanceReport } from '../../../../core/ports/platform-reporting';
import { headers } from 'next/headers';
import { portal } from '../../../../composition/portal';
import { ADMIN_WORKSPACE } from '../../../../config/administration-workspace';
import {
  PLATFORM_REPORTING as UI,
  type PlatformReportSearch,
} from '../../../../config/platform-reporting';
import { PortalHeading } from '../../../_portal/PortalHeading';
import { PortalError } from '../../../_portal/PortalError';
import { PlatformFinanceNavigation } from '../../../_portal/PlatformFinanceNavigation';
import { PlatformReportPeriod } from '../../../_portal/PlatformReportPeriod';
import { PlatformFinanceMetrics } from '../../../_portal/PlatformFinanceMetrics';
import { PlatformFinanceWorkspace } from '../../../_portal/PlatformFinanceWorkspace';
export default async function Page({
  searchParams,
}: {
  readonly searchParams: Promise<PlatformReportSearch>;
}) {
  const filter = await searchParams;
  const app = portal(new Headers(await headers()));
  if (!app.ok) return <PortalError />;
  const result = await app.value.reporting.finance(filter);
  if (!result.ok) return <PortalError />;
  return (
    <>
      <PortalHeading title={ADMIN_WORKSPACE.FINANCE} description={UI.FINANCE_HINT} />
      <PlatformFinanceNavigation filter={result.value.filter} />
      <FinanceContext data={result.value} />
      <PlatformFinanceWorkspace services={app.value} data={result.value} query={filter} />
    </>
  );
}

function FinanceContext({ data }: { readonly data: PlatformFinanceReport }) {
  if (data.filter.view === 'parametres') return null;
  return (
    <>
      <PlatformReportPeriod filter={data.filter} finance />
      <p className="portal-muted">{UI.PERIOD_NOTE}</p>
      {data.filter.view === 'journal' || data.filter.view === 'rapprochements' ? (
        <PlatformFinanceMetrics summary={data.summary} />
      ) : null}
    </>
  );
}
