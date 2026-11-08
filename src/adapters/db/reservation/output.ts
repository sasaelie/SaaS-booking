import { and, eq } from 'drizzle-orm';
import { sessions, bookings, organizations, activities } from '../schema';
import { required, type Transaction } from '../transaction';
import type { BookingRow } from './context';
import type { AtomicSeatReservationOutput } from '../../../core/ports/session-repository.port';
import { calculateSeatAvailability } from '../../../core/domain/seat-calculator';
async function reservationDetails(tx: Transaction, booking: BookingRow) {
  const [details] = await tx
    .select()
    .from(sessions)
    .innerJoin(activities, eq(sessions.activityId, activities.id))
    .innerJoin(organizations, eq(sessions.organizationId, organizations.id))
    .where(
      and(eq(sessions.id, booking.sessionId), eq(sessions.organizationId, booking.organizationId)),
    );
  if (!details) throw Error('Reservation context missing');
  return details;
}
export async function reservationOutput(
  tx: Transaction,
  booking: BookingRow,
  now: Date,
): Promise<AtomicSeatReservationOutput> {
  const details = await reservationDetails(tx, booking);
  const snapshots = await tx
    .select()
    .from(bookings)
    .where(
      and(
        eq(bookings.sessionId, booking.sessionId),
        eq(bookings.organizationId, booking.organizationId),
      ),
    );
  const availabilityAfterBooking = required(
    calculateSeatAvailability(details.sessions.capacity, snapshots, now),
  );
  return mapReservationOutput(booking, booking.activityName, availabilityAfterBooking);
}

function mapReservationOutput(
  booking: BookingRow,
  activityName: string,
  availabilityAfterBooking: AtomicSeatReservationOutput['availabilityAfterBooking'],
): AtomicSeatReservationOutput {
  const {
    id: bookingId,
    sessionId,
    organizationId,
    status,
    paymentMode,
    lockedUntil,
    checkoutUrl,
    currency,
    email: attendeeEmail,
  } = booking;
  return {
    bankInstructions: transferInstructions(booking),
    bookingId,
    sessionId,
    organizationId,
    status,
    paymentMode,
    lockedUntil,
    checkoutUrl,
    currency,
    attendeeEmail,
    availabilityAfterBooking,
    amountToPayCents:
      booking.unitPriceCents - booking.voucherDiscountCents - booking.amountPaidCents,
    activityName,
    merchantAccountId: booking.merchantAccountId,
  };
}

function transferInstructions(booking: BookingRow) {
  return booking.bankIban && booking.bankAccountName && booking.paymentReference
    ? {
        iban: booking.bankIban,
        accountName: booking.bankAccountName,
        reference: booking.paymentReference,
      }
    : null;
}
