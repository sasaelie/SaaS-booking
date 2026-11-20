import { PressableLink as Link } from '../_ui/PressableLink';
import type { PlatformReportFilter } from '../../core/validation/platform-reporting';
import { PLATFORM_REPORTING as UI } from '../../config/platform-reporting';
import { AdministrationTabStrip } from './AdministrationTabStrip';
import { reportQuery } from './platform-report-links';
const views = [
  ['journal', UI.JOURNAL],
  ['rapprochements', UI.RECONCILIATION],
  ['documents', UI.DOCUMENTS],
  ['ajustements', UI.COSTS],
  ['parametres', UI.SETTINGS],
] as const;
export function PlatformFinanceNavigation({ filter }: { readonly filter: PlatformReportFilter }) {
  return (
    <AdministrationTabStrip
      className="administration-finance-tabs"
      label={UI.FINANCE_HINT}
      activeKey={filter.view}
    >
      {views.map(([view, label]) => (
        <Link
          className="liquid-ice-button"
          key={view}
          href={`/plateforme/finances?${reportQuery(filter, { view, page: '1', status: '', scope: '', kind: '' })}`}
          aria-current={filter.view === view ? 'page' : undefined}
        >
          {label}
        </Link>
      ))}
    </AdministrationTabStrip>
  );
}
