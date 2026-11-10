import type { SessionDetails as Details } from '../../core/ports/session-details';
import { SESSION_UI as UI } from '../../config/session-details';
import { BookingCards } from './BookingCards';
import { Pagination } from './Pagination';
export function SessionAttendees({ data }: { readonly data: Details }) {
  const { organization: org, activity, session, bookings } = data;
  return (
    <section aria-label={UI.ATTENDEES} className="portal-section-stack">
      <h2>
        {UI.ATTENDEES} <span className="portal-muted">({bookings.total})</span>
      </h2>
      {bookings.bookings.length ? (
        <BookingCards
          bookings={bookings.bookings}
          organizationId={org.id}
          timezone={org.timezone}
        />
      ) : (
        <p className="portal-notice">{UI.EMPTY}</p>
      )}
      <Pagination
        page={bookings.page}
        total={bookings.total}
        startsAt={session.startsAt.toISOString()}
        path={`/app/${org.id}/seances/${activity.id}`}
      />
    </section>
  );
}
