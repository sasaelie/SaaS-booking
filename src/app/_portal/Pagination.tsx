import Link from 'next/link';
import { PORTAL, SAAS } from '../../config/constants';
export function Pagination({
  page,
  total,
  path,
  search = '',
  status = '',
}: {
  readonly page: number;
  readonly total: number;
  readonly path: string;
  readonly search?: string;
  readonly status?: string;
}) {
  function href(value: number) {
    return `${path}?${new URLSearchParams({ page: String(value), search, status })}`;
  }
  if (total <= SAAS.PAGE_SIZE) return null;
  return (
    <nav className="portal-pagination" aria-label={PORTAL.PAGE}>
      {page > 1 ? <Link href={href(page - 1)}>{PORTAL.PREVIOUS}</Link> : null}
      <span>
        {PORTAL.PAGE} {page}
      </span>
      {page * SAAS.PAGE_SIZE < total ? <Link href={href(page + 1)}>{PORTAL.NEXT}</Link> : null}
    </nav>
  );
}
