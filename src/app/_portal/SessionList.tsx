import type { PortalSession } from '../../core/ports/portal-models';
import { PORTAL, BOOKING_UI } from '../../config/constants';
import { portalDate } from './date-label';
import { AdminOperation } from './AdminOperation';
export function SessionList({
  sessions,
  timezone,
  organizationId,
}: {
  readonly sessions: readonly PortalSession[];
  readonly timezone: string;
  readonly organizationId: string;
}) {
  if (!sessions.length) return <p className="portal-muted">{PORTAL.NO_SESSIONS}</p>;
  return (
    <div className="portal-list">
      {sessions.map((session) => (
        <SessionCard
          key={`${session.activityId}-${session.startsAt.toISOString()}`}
          session={session}
          timezone={timezone}
          organizationId={organizationId}
        />
      ))}
    </div>
  );
}

function SessionCard({
  session,
  timezone,
  organizationId,
}: {
  readonly session: PortalSession;
  readonly timezone: string;
  readonly organizationId: string;
}) {
  return (
    <article
      className="portal-panel"
      key={`${session.activityId}-${session.startsAt.toISOString()}`}
    >
      <div className="portal-row">
        <div>
          <h3>{session.activityName}</h3>
          <p>{portalDate(session.startsAt, timezone)}</p>
        </div>
        <span className="portal-badge">
          {session.availabilityLabel} {BOOKING_UI.PLACES}
        </span>
      </div>
      <details className="portal-details">
        <summary>{PORTAL.CLOSE_SESSION}</summary>
        <div>
          <AdminOperation
            label={PORTAL.CLOSE_SESSION}
            reasonRequired
            command={sessionCommand(session, organizationId)}
          />
        </div>
      </details>
    </article>
  );
}

function sessionCommand(session: PortalSession, organizationId: string) {
  return session.id
    ? {
        action: 'close',
        organizationId,
        sessionId: session.id,
        confirmCancelExistingBookings: false,
      }
    : {
        action: 'pause',
        organizationId,
        activityId: session.activityId,
        startsAt: session.startsAt.toISOString(),
        endsAt: session.endsAt.toISOString(),
        confirmCancelExistingBookings: false,
      };
}
