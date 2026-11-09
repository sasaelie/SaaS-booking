import type { PlatformOperation } from '../../core/ports/platform-monitoring';
import { ADMIN, ADMIN_JOBS } from '../../config/administration';
import { ERROR_CODES } from '../../config/constants';
import { portalDate } from './date-label';
export function PlatformOperationCards({
  entries,
}: {
  readonly entries: readonly PlatformOperation[];
}) {
  return (
    <div className="portal-list">
      {entries.map((entry) => (
        <article key={entry.id} className="portal-panel administration-entry">
          <div className="administration-entry-heading">
            <strong>{entry.organizationName}</strong>
            <span className="portal-badge">{entry.attempts ? ADMIN.RETRY : ADMIN.PENDING}</span>
          </div>
          <h2>{ADMIN_JOBS[entry.type] ?? ADMIN.ERROR}</h2>
          <dl>
            <dt>{ADMIN.ATTEMPTS}</dt>
            <dd>{entry.attempts}</dd>
            <dt>{ADMIN.CREATED}</dt>
            <dd>{portalDate(entry.createdAt)}</dd>
            <dt>{ADMIN.NEXT}</dt>
            <dd>{portalDate(entry.availableAt)}</dd>
          </dl>
          <p className="portal-muted">{errorLabel(entry.lastError)}</p>
        </article>
      ))}
    </div>
  );
}
function errorLabel(code: string | null) {
  if (!code) return ADMIN.NO_ERROR;
  if (code === ERROR_CODES.CONFIGURATION_ERROR) return ADMIN.CONFIG_ERROR;
  if (code === ERROR_CODES.PAYMENT_PROVIDER_ERROR) return ADMIN.PROVIDER_ERROR;
  return ADMIN.ERROR;
}
