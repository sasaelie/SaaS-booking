import { checkoutParameters } from './stripe-checkout';
import Stripe from 'stripe';
import { DEFAULTS, ERROR_CODES, PAYMENT_MODES, TIME } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import type {
  PaymentGatewayPort,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ParsedWebhookPaymentEvent,
  RefundPaymentInput,
} from '../../core/ports/payment-gateway.port';
import {
  StripeMetadataSchema,
  StripeAmountSchema,
  StripeCurrencySchema,
} from './stripe-validation';
function accountOptions(account: string | null): Stripe.RequestOptions {
  return account ? { stripeAccount: account } : {};
}
function intentId(value: Stripe.Checkout.Session['payment_intent']): string | null {
  return typeof value === 'string' ? value : (value?.id ?? null);
}
function parseEvent(event: Stripe.Event): Result<ParsedWebhookPaymentEvent | null> {
  if (
    event.type !== 'checkout.session.completed' &&
    event.type !== 'checkout.session.async_payment_succeeded'
  )
    return ok(null);
  const session = event.data.object;
  if (session.mode !== 'payment' || session.payment_status !== 'paid') return ok(null);
  const metadata = StripeMetadataSchema.safeParse(session.metadata);
  const amount = StripeAmountSchema.safeParse(session.amount_total);
  const reference = intentId(session.payment_intent);
  if (
    !metadata.success ||
    !amount.success ||
    !reference ||
    !StripeCurrencySchema.safeParse(session.currency).success
  )
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Stripe', 'parseEvent');
  return ok({
    eventId: event.id,
    provider: PAYMENT_MODES.STRIPE,
    bookingId: metadata.data.booking_id,
    organizationId: metadata.data.organization_id,
    paymentReference: reference,
    checkoutReference: session.id,
    amountPaidCents: amount.data,
    currency: DEFAULTS.CURRENCY,
    merchantAccountId: event.account ?? null,
  });
}
export class StripePaymentAdapter implements PaymentGatewayPort {
  readonly mode = PAYMENT_MODES.STRIPE;
  constructor(
    private readonly stripe: Stripe,
    private readonly webhookSecret: string,
    private readonly nowProvider = () => new Date(),
  ) {}
  async initiatePayment(input: InitiatePaymentInput): Promise<Result<InitiatePaymentOutput>> {
    const now = this.nowProvider();
    if (
      !StripeAmountSchema.safeParse(input.amountCents).success ||
      input.currency !== DEFAULTS.CURRENCY ||
      input.expiresAt <= now
    )
      return failure(ERROR_CODES.VALIDATION_FAILED, 'Stripe', 'initiatePayment');
    try {
      const session = await this.stripe.checkout.sessions.create(checkoutParameters(input, now), {
        ...accountOptions(input.merchantAccountId),
        idempotencyKey: `checkout:${input.bookingId}`,
      });
      if (!session.url)
        return failure(ERROR_CODES.PAYMENT_PROVIDER_ERROR, 'Stripe', 'initiatePayment');
      return ok({
        paymentReference: session.id,
        checkoutUrl: session.url,
        expiresAt: new Date(session.expires_at * TIME.SECOND_MS),
      });
    } catch {
      return failure(ERROR_CODES.PAYMENT_PROVIDER_ERROR, 'Stripe', 'initiatePayment');
    }
  }
  async verifyWebhookAndParse(
    body: string,
    signature: string,
  ): Promise<Result<ParsedWebhookPaymentEvent | null>> {
    try {
      return parseEvent(this.stripe.webhooks.constructEvent(body, signature, this.webhookSecret));
    } catch {
      return failure(ERROR_CODES.UNAUTHORIZED, 'Stripe', 'verifyWebhookAndParse');
    }
  }
  async refundPayment(input: RefundPaymentInput): Promise<Result<{ readonly refundId: string }>> {
    try {
      if (!StripeAmountSchema.safeParse(input.amountCents).success)
        return failure(ERROR_CODES.VALIDATION_FAILED, 'Stripe', 'refundPayment');
      const refund = await this.stripe.refunds.create(
        {
          payment_intent: input.paymentReference,
          amount: input.amountCents,
          reason: 'requested_by_customer',
        },
        {
          ...accountOptions(input.merchantAccountId),
          idempotencyKey: input.idempotencyKey,
        },
      );
      return ok({ refundId: refund.id });
    } catch {
      return failure(ERROR_CODES.PAYMENT_PROVIDER_ERROR, 'Stripe', 'refundPayment');
    }
  }
}
