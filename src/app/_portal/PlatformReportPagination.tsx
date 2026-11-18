import type { PlatformFinanceReport } from '../../core/ports/platform-reporting';
import { ADMIN_WORKSPACE as UI } from '../../config/administration-workspace';
import { PORTAL } from '../../config/constants';
import { PressableLink as Link } from '../_ui/PressableLink';
import { reportQuery } from './platform-report-links';
export function PlatformReportPagination({ data }: { readonly data: PlatformFinanceReport }) {
  const pages = Math.max(1, Math.ceil(data.total / data.filter.pageSize));
  return (
    <nav className="administration-pagination" aria-label={UI.PAGE}>
      <span className="portal-muted">
        {data.total} {UI.RESULTS} · {UI.PAGE} {data.page} {UI.OF} {pages}
      </span>
      <div>
        {data.page > 1 ? (
          <Link
            className="liquid-ice-button"
            href={`/plateforme/finances?${reportQuery(data.filter, { page: String(data.page - 1) })}`}
          >
            {PORTAL.PREVIOUS}
          </Link>
        ) : null}
        {data.page < pages ? (
          <Link
            className="liquid-ice-button"
            href={`/plateforme/finances?${reportQuery(data.filter, { page: String(data.page + 1) })}`}
          >
            {PORTAL.NEXT}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
