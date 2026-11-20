import type { PortalServices } from '../../composition/portal';
import type { PlatformFinanceReport } from '../../core/ports/platform-reporting';
import { PLATFORM_REPORTING as UI } from '../../config/platform-reporting';
import { PlatformLedger } from './PlatformLedger';
import { PlatformReconciliation } from './PlatformReconciliation';
import { PlatformReportPagination } from './PlatformReportPagination';
import { PlatformCostForm } from './PlatformCostForm';
import { PortalError } from './PortalError';
import { reportQuery } from './platform-report-links';
import { PressableLink as Link } from '../_ui/PressableLink';
import type { PlatformReportSearch } from '../../config/platform-reporting';
import { PlatformBillingWorkspace } from './platform-billing/PlatformBillingWorkspace';
export async function PlatformFinanceWorkspace({
  services,
  data,
  query,
}: {
  readonly services: PortalServices;
  readonly data: PlatformFinanceReport;
  readonly query: PlatformReportSearch;
}) {
  if (data.filter.view === 'documents' || data.filter.view === 'parametres')
    return <PlatformBillingWorkspace services={services} data={data} query={query} />;
  if (data.filter.view === 'ajustements') {
    const organizations = await services.platform.overview({ search: data.filter.search });
    return organizations.ok ? <PlatformCostForm data={organizations.value} /> : <PortalError />;
  }
  return (
    <>
      {data.filter.view === 'rapprochements' ? (
        <PlatformReconciliation entries={data.payments} />
      ) : (
        <PlatformLedger data={data} />
      )}
      <PlatformReportPagination data={data} />
      {data.filter.view === 'journal' ? <FinanceExports data={data} /> : null}
    </>
  );
}

function FinanceExports({ data }: { readonly data: PlatformFinanceReport }) {
  return (
    <div className="administration-export-actions">
      <Link
        prefetch={false}
        className="liquid-ice-button portal-button"
        href={`/api/plateforme/export?${reportQuery(data.filter, { format: 'csv' })}`}
        download
      >
        {UI.CSV}
      </Link>
      <Link
        prefetch={false}
        className="portal-secondary-action"
        href={`/api/plateforme/export?${reportQuery(data.filter, { format: 'xlsx' })}`}
        download
      >
        {UI.XLSX}
      </Link>
      <p className="portal-muted">{UI.EXPORT_NOTE}</p>
    </div>
  );
}
