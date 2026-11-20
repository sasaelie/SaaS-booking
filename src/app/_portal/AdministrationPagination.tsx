import { PressableLink as Link } from '../_ui/PressableLink';
import {
  ADMIN_WORKSPACE as UI,
  type AdministrationSearchParams,
} from '../../config/administration-workspace';
import { PORTAL, SAAS } from '../../config/constants';
export function AdministrationPagination({
  page,
  total,
  path,
  filter,
}: {
  readonly page: number;
  readonly total: number;
  readonly path: string;
  readonly filter: AdministrationSearchParams;
}) {
  const size = Number(filter.pageSize) || SAAS.PAGE_SIZE;
  const pages = Math.max(1, Math.ceil(total / size));
  function href(value: number) {
    const query = new URLSearchParams();
    for (const [key, entry] of Object.entries(filter)) if (entry) query.set(key, entry);
    query.set('page', String(value));
    return `${path}?${query}`;
  }
  return (
    <nav className="administration-pagination" aria-label={PORTAL.PAGE}>
      <span className="portal-muted">
        {total} {UI.RESULTS} · {UI.PAGE} {page} {UI.OF} {pages}
      </span>
      <div>
        {page > 1 ? (
          <Link className="liquid-ice-button" href={href(page - 1)}>
            {PORTAL.PREVIOUS}
          </Link>
        ) : null}
        {page < pages ? (
          <Link className="liquid-ice-button" href={href(page + 1)}>
            {PORTAL.NEXT}
          </Link>
        ) : null}
      </div>
    </nav>
  );
}
