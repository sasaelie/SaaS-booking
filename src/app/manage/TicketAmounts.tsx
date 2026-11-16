import type { SelfBookingContext } from '../../core/validation/self-booking';
import { participantTicketAmounts } from '../../core/domain/participant-ticket';
import { formatMoney } from '../../lib/format-money';
export function TicketAmounts({ booking }: { readonly booking: SelfBookingContext }) {
  const ticket = booking.ticket;
  if (!ticket) return null;
  const amounts = participantTicketAmounts(booking);
  return (
    <dl className="ticket-money">
      {amounts.map(({ label, value }) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{formatMoney(value, ticket.currency)}</dd>
        </div>
      ))}
    </dl>
  );
}
