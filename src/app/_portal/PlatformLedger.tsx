import type { PlatformFinanceReport, PlatformLedgerRow } from '../../core/ports/platform-reporting';
import { PLATFORM_REPORTING as UI } from '../../config/platform-reporting';
import { PressableLink as Link } from '../_ui/PressableLink';
import { PLATFORM_BILLING } from '../../config/platform-billing';
import { StatusBadge } from './StatusBadge';
import { formatMoney } from '../_ui/format-money';
import { portalDate } from './date-label';
import { reportQuery } from './platform-report-links';
export function PlatformLedger({ data }: { readonly data: PlatformFinanceReport }) {
  return (
    <div className="portal-panel administration-records">
      {data.entries.length ? (
        data.entries.map((row) => (
          <article className="administration-compact-row administration-ledger-row" key={row.id}>
            <div>
              <strong>{UI.KINDS[row.kind] ?? row.kind}</strong>
              <p className="portal-muted">
                {row.organizationName} · {portalDate(row.occurredAt)}
              </p>
            </div>
            <div className="administration-ledger-amount">
              <strong>{formatMoney(row.amountCents, 'EUR')}</strong>
              <ScopeBadge scope={row.scope} />
            </div>
            <details className="administration-row-details">
              <summary>{UI.DETAILS}</summary>
              <p className="administration-reference">{row.reference ?? UI.UNKNOWN}</p>
              <DocumentAction row={row} filter={data.filter} />
            </details>
          </article>
        ))
      ) : (
        <p className="portal-muted">{UI.EMPTY}</p>
      )}
    </div>
  );
}
function DocumentAction({
  row,
  filter,
}: {
  readonly row: PlatformLedgerRow;
  readonly filter: PlatformFinanceReport['filter'];
}) {
  if (row.documentId)
    return (
      <Link
        className="portal-secondary-action"
        href={`/api/plateforme/documents?id=${encodeURIComponent(row.documentId)}`}
        download
        prefetch={false}
      >
        {row.documentNumber} · {PLATFORM_BILLING.DOWNLOAD}
      </Link>
    );
  if (row.kind === 'SUBSCRIPTION' && row.reference?.startsWith('in_') && row.amountCents > 0)
    return (
      <Link
        download
        prefetch={false}
        className="portal-secondary-action"
        href={`/api/plateforme/documents?entry=${encodeURIComponent(row.id)}`}
      >
        {UI.STRIPE_INVOICE}
      </Link>
    );
  if (row.kind !== 'COMMISSION' && row.kind !== 'COMMISSION_REFUND') return null;
  const source = row.id.replace(/^commission:/, '');
  return (
    <Link
      className="portal-secondary-action"
      href={`/plateforme/finances?${reportQuery(filter, { view: 'documents', source, documentKind: row.kind === 'COMMISSION' ? 'INVOICE' : 'CREDIT' })}`}
    >
      {row.kind === 'COMMISSION' ? UI.PREPARE_INVOICE : UI.PREPARE_CREDIT}
    </Link>
  );
}

function ScopeBadge({ scope }: { readonly scope: PlatformLedgerRow['scope'] }) {
  return (
    <StatusBadge
      status={{
        tone: scope === 'PLATFORM' ? 'green' : scope === 'CREDIT' ? 'orange' : 'neutral',
        label: scope === 'PLATFORM' ? UI.PLATFORM : scope === 'CREDIT' ? UI.CREDIT : UI.ORGANIZER,
      }}
    />
  );
}
