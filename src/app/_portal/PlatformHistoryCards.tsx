import type { PlatformAuditEvent } from '../../core/ports/platform-monitoring';
import { ADMIN, ADMIN_ACTIONS } from '../../config/administration';
import { portalDate } from './date-label';
export function PlatformHistoryCards({
  entries,
}: {
  readonly entries: readonly PlatformAuditEvent[];
}) {
  return (
    <div className="portal-list">
      {entries.map((entry) => (
        <article key={entry.id} className="portal-panel administration-entry">
          <strong>{ADMIN_ACTIONS[entry.action] ?? ADMIN.UNKNOWN_ACTION}</strong>
          <dl>
            <dt>{ADMIN.ORGANIZATION}</dt>
            <dd>{entry.organizationName ?? ADMIN.DEFAULT_ORGANIZATION}</dd>
            <dt>{ADMIN.AUTHOR}</dt>
            <dd>{entry.actorName ?? ADMIN.DEFAULT_ACTOR}</dd>
            <dt>{ADMIN.DATE}</dt>
            <dd>{portalDate(entry.createdAt)}</dd>
          </dl>
        </article>
      ))}
    </div>
  );
}
