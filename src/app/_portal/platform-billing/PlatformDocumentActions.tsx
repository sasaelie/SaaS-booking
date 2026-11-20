import type { PlatformReportInput } from '../../../core/validation/platform-reporting';
import { PLATFORM_REPORTING as UI } from '../../../config/platform-reporting';
import { PressableLink as Link } from '../../_ui/PressableLink';
import { reportQuery } from '../platform-report-links';
export function PlatformDocumentActions({ filter }: { readonly filter: PlatformReportInput }) {
  return (
    <div className="administration-export-actions">
      <Link
        className="liquid-ice-button portal-button"
        href={`/plateforme/finances?${reportQuery(filter, { view: 'journal', kind: 'COMMISSION', scope: 'PLATFORM', page: '1' })}`}
      >
        {UI.PREPARE_INVOICE}
      </Link>
      <Link
        className="portal-secondary-action"
        href={`/plateforme/finances?${reportQuery(filter, { view: 'journal', kind: 'COMMISSION_REFUND', scope: 'PLATFORM', page: '1' })}`}
      >
        {UI.PREPARE_CREDIT}
      </Link>
    </div>
  );
}
