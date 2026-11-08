import type { PortalBooking } from '../../core/ports/portal-models';
import { PORTAL, BOOKING_STATUS_LABELS } from '../../config/constants';
import { formatMoney } from '../_ui/format-money';
import { portalDate } from './date-label';
import { BookingManagement } from './BookingManagement';
interface BookingCardProps {
  readonly booking: PortalBooking;
  readonly organizationId: string;
  readonly timezone: string;
}
export function BookingCards({
  bookings,
  organizationId,
  timezone,
}: {
  readonly bookings: readonly PortalBooking[];
  readonly organizationId: string;
  readonly timezone: string;
}) {
  return (
    <div className="portal-list">
      {bookings.map((booking) => (
        <BookingCard
          key={booking.id}
          booking={booking}
          organizationId={organizationId}
          timezone={timezone}
        />
      ))}
    </div>
  );
}

function BookingCard({ booking, organizationId, timezone }: BookingCardProps) {
  return (
    <details className="portal-panel portal-booking-card">
      <BookingSummary booking={booking} timezone={timezone} />
      <div className="portal-booking-detail">
        <dl>
          <dt>{PORTAL.EMAIL}</dt>
          <dd>
            <a href={`mailto:${booking.email}`}>{booking.email}</a>
          </dd>
          {booking.phone ? (
            <>
              <dt>{PORTAL.PHONE}</dt>
              <dd>{booking.phone}</dd>
            </>
          ) : null}
        </dl>
        <BookingManagement booking={booking} organizationId={organizationId} timezone={timezone} />
      </div>
    </details>
  );
}

function BookingSummary({ booking, timezone }: Pick<BookingCardProps, 'booking' | 'timezone'>) {
  return (
    <summary>
      <div>
        <strong>
          {booking.firstName} {booking.lastName}
        </strong>
        <small>{booking.activityName}</small>
        <small>{PORTAL.VIEW_DETAILS}</small>
      </div>
      <div>
        <strong>{portalDate(booking.startsAt, timezone)}</strong>
        <small>{PORTAL.SESSION}</small>
      </div>
      <span className="portal-badge">{BOOKING_STATUS_LABELS[booking.status]}</span>
      <div>
        <strong>{formatMoney(booking.amountPaidCents, booking.currency)}</strong>
        <small>{PORTAL.AMOUNT_PAID}</small>
      </div>
    </summary>
  );
}
