import type {
  PlatformDocumentsPage,
  PlatformDocumentListRow,
} from '../../../core/ports/platform-billing';
import { PLATFORM_BILLING as UI } from '../../../config/platform-billing';
import { formatMoney } from '../../../lib/format-money';
import { portalDate } from '../date-label';
import { StatusBadge } from '../StatusBadge';
import { PressableLink as Link } from '../../_ui/PressableLink';
export function PlatformDocuments({
  data,
  originalsAvailable,
}: {
  readonly data: PlatformDocumentsPage;
  readonly originalsAvailable: boolean;
}) {
  return (
    <section className="portal-panel administration-records">
      {data.entries.length ? (
        data.entries.map((row) => (
          <DocumentRow row={row} originalsAvailable={originalsAvailable} key={row.id} />
        ))
      ) : (
        <p className="portal-muted">{UI.EMPTY}</p>
      )}
      {!originalsAvailable && data.entries.some((row) => row.kind === 'PROVIDER') ? (
        <p className="portal-muted">{UI.PROVIDER_UNAVAILABLE}</p>
      ) : null}
    </section>
  );
}

function DocumentRow({
  row,
  originalsAvailable,
}: {
  readonly row: PlatformDocumentListRow;
  readonly originalsAvailable: boolean;
}) {
  return (
    <article key={row.id} className="administration-compact-row administration-document-row">
      <div>
        <strong>{row.number}</strong>
        <p className="portal-muted">
          {row.organizationName} · {portalDate(row.issuedAt)}
        </p>
      </div>
      <div>
        <DocumentStatus row={row} />
        <strong>{formatMoney(row.amountCents, UI.CURRENCY)}</strong>
      </div>
      {row.kind !== 'PROVIDER' || originalsAvailable ? (
        <Link
          download
          prefetch={false}
          className="portal-secondary-action"
          href={`/api/plateforme/documents?${row.kind === 'PROVIDER' ? 'entry' : 'id'}=${encodeURIComponent(row.id)}`}
        >
          {UI.DOWNLOAD}
        </Link>
      ) : (
        <button className="portal-secondary-action" type="button" disabled>
          {UI.DOWNLOAD}
        </button>
      )}
    </article>
  );
}

function DocumentStatus({ row }: { readonly row: PlatformDocumentListRow }) {
  return (
    <StatusBadge
      status={{
        tone: row.kind === 'PROVIDER' ? 'neutral' : 'orange',
        label:
          row.kind === 'PROVIDER'
            ? 'Stripe'
            : `${row.kind === 'CREDIT' ? UI.CREDIT : UI.INVOICE} · ${UI.TO_TRANSMIT}`,
      }}
    />
  );
}
