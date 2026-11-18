import type { PortalServices } from '../../../composition/portal';
import type { PlatformFinanceReport } from '../../../core/ports/platform-reporting';
import type { PlatformReportSearch } from '../../../config/platform-reporting';
import { PLATFORM_BILLING as UI } from '../../../config/platform-billing';
import { PlatformBillingSettings } from './PlatformBillingSettings';
import { PlatformBillingPreparation } from './PlatformBillingPreparation';
import { PlatformDocuments } from './PlatformDocuments';
import { PlatformReportPagination } from '../PlatformReportPagination';
import { PortalError } from '../PortalError';
import { PlatformTransmissionNotice } from './PlatformTransmissionNotice';
import { PlatformDocumentActions } from './PlatformDocumentActions';
export async function PlatformBillingWorkspace({
  services,
  data,
  query,
}: {
  readonly services: PortalServices;
  readonly data: PlatformFinanceReport;
  readonly query: PlatformReportSearch;
}) {
  const settings = await services.billing.settings();
  if (!settings.ok) return <PortalError />;
  if (data.filter.view === 'parametres')
    return <PlatformBillingSettings settings={settings.value} />;
  const [documents, source] = await Promise.all([
    services.billing.documents(data.filter),
    query.source
      ? services.billing.source({ id: query.source, kind: query.documentKind ?? 'INVOICE' })
      : Promise.resolve(null),
  ]);
  if (!documents.ok) return <PortalError />;
  return (
    <>
      <p className="portal-muted">{UI.PROVIDER_NOTE}</p>
      <PlatformDocumentActions filter={data.filter} />
      <PlatformBillingPreparation source={source} settings={settings.value} />
      <PlatformDocuments
        data={documents.value}
        originalsAvailable={services.billing.canReadOriginals()}
      />
      <PlatformReportPagination
        data={{ ...data, total: documents.value.total, page: documents.value.page }}
      />
      <PlatformTransmissionNotice />
    </>
  );
}
