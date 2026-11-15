'use client';
import type { SelfBookingContext } from '../../core/validation/self-booking';
import { PARTICIPANT_UI as UI, BOOKING_STATUSES, DEFAULTS } from '../../config/constants';
import { isAdmissionValid } from '../../core/domain/participant-access';
import { TicketAccess } from './TicketAccess';
import { TicketAmounts } from './TicketAmounts';
export function ParticipantTicket({ booking }: { readonly booking: SelfBookingContext }) {
  const ticket = booking.ticket;
  if (!ticket) return null;
  const status = ticketStatus(booking);
  const date = new Intl.DateTimeFormat(DEFAULTS.LOCALE, {
    timeZone: booking.timezone,
    dateStyle: 'full',
    timeStyle: 'short',
  }).format(new Date(booking.startsAtIso));
  return (
    <section className="participant-ticket printable-ticket" aria-label={UI.TICKET}>
      {ticket.isSimulation ? <strong className="ticket-test">{UI.TEST}</strong> : null}
      <header>
        <span>{UI.TICKET}</span>
        <h2>{booking.activityName}</h2>
        <p>{booking.organizationName}</p>
        <p>{date}</p>
        <p>{ticket.participantName}</p>
      </header>
      <p className="status-badge" data-tone={status.valid ? 'green' : 'orange'}>
        {status.label}
      </p>
      <TicketAmounts booking={booking} />
      {ticket.address ? <p className="ticket-address">{ticket.address}</p> : null}
      <TicketAccess ticket={ticket} />
    </section>
  );
}
function ticketStatus(booking: SelfBookingContext) {
  const ticket = booking.ticket;
  const valid = Boolean(
    ticket &&
    isAdmissionValid(
      booking.status,
      ticket.sessionCancelled,
      new Date(ticket.endsAtIso),
      new Date(),
    ),
  );
  const label = valid
    ? UI.VALID
    : booking.status.startsWith('CANCELLED') || ticket?.sessionCancelled
      ? UI.CANCELLED
      : booking.status !== BOOKING_STATUSES.CONFIRMED
        ? UI.PENDING
        : UI.HISTORICAL;
  return { valid, label };
}
