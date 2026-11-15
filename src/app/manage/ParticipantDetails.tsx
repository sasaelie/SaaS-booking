import type { SelfBookingContext } from '../../core/validation/self-booking';
import type { ParticipantTicket } from '../../core/validation/participant';
import { PARTICIPANT_UI as UI } from '../../config/constants';
import { ParticipantVouchers } from './ParticipantVouchers';
export function ParticipantDetails({
  booking,
  simulationId,
}: {
  readonly booking: SelfBookingContext;
  readonly simulationId?: string;
}) {
  const ticket = booking.ticket;
  if (!ticket) return null;
  return (
    <div className="participant-details">
      {ticket.address === null || ticket.address || ticket.practicalInfo ? (
        <section>
          <h2>{UI.LOCATION}</h2>
          <p>{ticket.address === null ? UI.ADDRESS_PENDING : ticket.address}</p>
          {ticket.practicalInfo ? <p>{ticket.practicalInfo}</p> : null}
        </section>
      ) : null}
      <ParticipantContacts ticket={ticket} />
      <ParticipantVouchers booking={booking} simulationId={simulationId} />
    </div>
  );
}
function ParticipantContacts({ ticket }: { readonly ticket: ParticipantTicket }) {
  if (!ticket.phone && !ticket.socialLinks.length) return null;
  return (
    <section>
      <h2>{UI.CONTACT}</h2>
      <nav aria-label={UI.CONTACT} className="ticket-contacts">
        {ticket.phone ? (
          <a href={`tel:${ticket.phone.replace(/[^+\d]/g, '')}`}>
            {UI.PHONE} · {ticket.phone}
          </a>
        ) : null}
        {ticket.socialLinks.map((link) => (
          <a key={link.label} href={link.url} target="_blank" rel="noopener noreferrer">
            {link.label}
          </a>
        ))}
      </nav>
    </section>
  );
}
