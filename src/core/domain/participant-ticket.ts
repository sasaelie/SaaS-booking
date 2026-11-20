import type { SelfBookingContext } from '../validation/self-booking';
import { BOOKING_STATUSES, PARTICIPANT_UI as UI } from '../../config/constants';
import { isAdmissionValid } from './participant-access';
export function participantTicketStatus(booking: SelfBookingContext, now = new Date()) {
  const ticket = booking.ticket;
  const valid = Boolean(
    ticket &&
    isAdmissionValid(booking.status, ticket.sessionCancelled, new Date(ticket.endsAtIso), now),
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
export function participantTicketAmounts(booking: SelfBookingContext) {
  const ticket = booking.ticket;
  if (!ticket) return [];
  const due =
    booking.status === BOOKING_STATUSES.CONFIRMED && !ticket.sessionCancelled
      ? Math.max(0, ticket.unitPriceCents - ticket.voucherDiscountCents - ticket.amountPaidCents)
      : 0;
  const amounts: { label: string; value: number }[] = [
    { label: UI.PRICE, value: ticket.unitPriceCents },
    { label: ticket.isSimulation ? UI.PAID_TEST : UI.PAID, value: ticket.amountPaidCents },
  ];
  if (ticket.voucherDiscountCents > 0)
    amounts.push({ label: UI.COVERED, value: ticket.voucherDiscountCents });
  if (due > 0) amounts.push({ label: ticket.isSimulation ? UI.DUE_TEST : UI.DUE, value: due });
  return amounts;
}
