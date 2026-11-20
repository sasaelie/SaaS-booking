import type { PlatformReconciliationRow } from '../../core/ports/platform-reporting';
import { PLATFORM_REPORTING as UI } from '../../config/platform-reporting';
import { StatusBadge } from './StatusBadge';
import { formatMoney } from '../_ui/format-money';
import { portalDate } from './date-label';
export function PlatformReconciliation({
  entries,
}: {
  readonly entries: readonly PlatformReconciliationRow[];
}) {
  return (
    <div className="portal-panel administration-records">
      {entries.length ? (
        entries.map((row) => (
          <article className="administration-compact-row" key={row.id}>
            <div className="administration-entry-heading">
              <strong>{row.organizationName}</strong>
              <ReconciliationStatus row={row} />
            </div>
            <p className="portal-muted">
              {portalDate(row.paidAt)} · {formatMoney(row.grossCents, 'EUR')}
            </p>
            <details className="administration-row-details">
              <summary>{UI.DETAILS}</summary>
              <ReconciliationDetails row={row} />
            </details>
          </article>
        ))
      ) : (
        <p className="portal-muted">{UI.EMPTY}</p>
      )}
    </div>
  );
}

function ReconciliationDetails({ row }: { readonly row: PlatformReconciliationRow }) {
  return (
    <dl className="administration-reconciliation-details">
      <dt>{UI.COMMISSION}</dt>
      <dd>{formatMoney(row.commissionCents, 'EUR')}</dd>
      <dt>{UI.BANK_FEE}</dt>
      <dd>{row.feeCents === null ? UI.UNKNOWN : formatMoney(row.feeCents, 'EUR')}</dd>
      <dt>{UI.NET_ORGANIZER}</dt>
      <dd>{row.netCents === null ? UI.UNKNOWN : formatMoney(row.netCents, 'EUR')}</dd>
      <dt>{UI.REFERENCE}</dt>
      <dd>{row.reference ?? UI.UNKNOWN}</dd>
    </dl>
  );
}

function ReconciliationStatus({ row }: { readonly row: PlatformReconciliationRow }) {
  return (
    <StatusBadge
      status={{
        tone:
          row.status === 'RECONCILED' ? 'green' : row.status === 'PENDING' ? 'orange' : 'neutral',
        label:
          row.status === 'RECONCILED'
            ? UI.RECONCILED
            : row.status === 'PENDING'
              ? UI.PENDING
              : UI.HISTORICAL,
      }}
    />
  );
}
