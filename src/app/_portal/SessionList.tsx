import type { PortalSession } from '../../core/ports/portal-models';
import { SessionPlanning } from '../_planning/SessionPlanning';
import { PORTAL, BOOKING_UI } from '../../config/constants';
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
    <SessionPlanning
      timezone={timezone}
      sessions={sessions.map((session) => ({
        id: `${session.activityId}-${session.startsAt.toISOString()}`,
        activityId: session.activityId,
        name: session.activityName,
        startsAt: session.startsAt.toISOString(),
        endsAt: session.endsAt.toISOString(),
        availability: `${session.availabilityLabel} ${BOOKING_UI.PLACES}`,
        isBookable: false,
        isCancelled: session.isCancelled,
        href: `/app/${organizationId}/seances/${session.activityId}?${new URLSearchParams({ startsAt: session.startsAt.toISOString() })}`,
      }))}
    />
  );
}

export function SessionCancellation({
  session,
  organizationId,
}: {
  readonly session: PortalSession;
  readonly organizationId: string;
}) {
  if (session.isCancelled || session.startsAt <= new Date()) return null;
  return (
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
