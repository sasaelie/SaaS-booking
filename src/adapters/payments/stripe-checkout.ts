import type Stripe from 'stripe';
import { BOOKING_LIMITS, TIME } from '../../config/constants';
import type { InitiatePaymentInput } from '../../core/ports/payment-gateway.port';
export function checkoutParameters(
  input: InitiatePaymentInput,
  _now: Date,
): Stripe.Checkout.SessionCreateParams {
  const expires_at = Math.ceil(input.expiresAt.getTime() / TIME.SECOND_MS) + 1;
  return {
    mode: 'payment',
    payment_method_types: ['card'],
    customer_email: input.customerEmail,
    expires_at,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    metadata: { organization_id: input.organizationId, booking_id: input.bookingId },
    line_items: [
      {
        quantity: BOOKING_LIMITS.SEATS_PER_BOOKING,
        price_data: {
          currency: input.currency.toLowerCase(),
          unit_amount: input.amountCents,
          product_data: { name: input.activityName },
        },
      },
    ],
  };
}
