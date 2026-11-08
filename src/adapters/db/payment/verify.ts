import type { BookingRow } from '../reservation/context';
import type { ParsedWebhookPaymentEvent } from '../../../core/ports/payment-gateway.port';
import { PAYMENT_MODES } from '../../../config/constants';
export function matchesBooking(booking: BookingRow, event: ParsedWebhookPaymentEvent): boolean {
  return (
    booking.paymentMode === PAYMENT_MODES.STRIPE &&
    event.currency === booking.currency &&
    event.amountPaidCents === booking.unitPriceCents - booking.voucherDiscountCents &&
    event.merchantAccountId === booking.merchantAccountId &&
    (!booking.checkoutReference || booking.checkoutReference === event.checkoutReference)
  );
}
