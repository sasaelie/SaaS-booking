import type { SelfBookingContext } from '../../core/validation/self-booking';
import { PARTICIPANT_UI as UI, BOOKING_STATUSES } from '../../config/constants';
import { formatMoney } from '../../lib/format-money';
export function TicketAmounts({ booking }: { readonly booking: SelfBookingContext }) {
  const ticket = booking.ticket;
  if (!ticket) return null;
  const due =
    booking.status === BOOKING_STATUSES.CONFIRMED && !ticket.sessionCancelled
      ? Math.max(0, ticket.unitPriceCents - ticket.voucherDiscountCents - ticket.amountPaidCents)
      : 0;
  const amounts: { label: string; value: number }[] = [
    { label: UI.PRICE, value: ticket.unitPriceCents },
    { label: UI.PAID, value: ticket.amountPaidCents },
  ];
  if (ticket.voucherDiscountCents > 0)
    amounts.push({ label: UI.COVERED, value: ticket.voucherDiscountCents });
  if (due > 0) amounts.push({ label: UI.DUE, value: due });
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
