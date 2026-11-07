// src/adapters/payments/stripe-payment.adapter.ts
import {
  ERROR_CODES,
  PAYMENT_MODES,
  PAYMENT_RULES,
} from '../../config/constants';
import type {
  InitiatePaymentInput,
  InitiatePaymentOutput,
  ParsedWebhookPaymentEvent,
  PaymentGatewayPort,
  RefundPaymentInput,
} from '../../core/ports/payment-gateway.port';
import { failAndLog } from '../../lib/logger';
import { ok, type AppError, type Result } from '../../lib/result';
export interface StripeCheckoutSessionObject {
  readonly id: string;
  readonly url: string | null;
  readonly payment_intent: string | null;
  readonly amount_total: number | null;
  readonly metadata?: Readonly<Record<string, string>> | null;
}
export interface StripeWebhookEventObject {
  readonly id: string;
  readonly type: string;
  readonly data: { readonly object: StripeCheckoutSessionObject };
}
export interface StripeSdkClient {
  readonly checkout: {
    readonly sessions: {
      create(params: {
        readonly mode: 'payment';
        readonly customer_email: string;
        readonly expires_at: number;
        readonly success_url: string;
        readonly cancel_url: string;
        readonly metadata: Readonly<Record<string, string>>;
        readonly line_items: readonly {
          readonly quantity: 1;
          readonly price_data: {
            readonly currency: string;
            readonly unit_amount: number;
            readonly product_data: { readonly name: string };
          };
        }[];
      }): Promise<StripeCheckoutSessionObject>;
    };
  };
  readonly refunds: {
    create(params: {
      readonly payment_intent: string;
      readonly amount?: number;
      readonly reason: 'duplicate' | 'requested_by_customer';
    }): Promise<{ readonly id: string }>;
  };
  readonly webhooks: {
    constructEvent(
      payload: string,
      header: string,
      secret: string,
    ): StripeWebhookEventObject;
  };
}
export class StripePaymentAdapter implements PaymentGatewayPort {
  public readonly mode = PAYMENT_MODES.STRIPE;
  public constructor(
    private readonly stripe: StripeSdkClient,
    private readonly webhookSecret: string,
  ) {}
  public async initiatePayment(
    input: InitiatePaymentInput,
  ): Promise<Result<InitiatePaymentOutput, AppError>> {
    if (input.amountCents <= 0) {
      return failAndLog({
        code: ERROR_CODES.VALIDATION_FAILED,
        module: 'StripePaymentAdapter',
        fn: 'initiatePayment',
        cause: 'Montant Stripe invalide (doit être > 0 centime)',
        received: String(input.amountCents),
        expected: 'entier > 0',
      });
    }
    try {
      const expiresAtUnixSeconds = Math.floor(input.expiresAt.getTime() / 1000);
      const session = await this.stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: input.customerEmail,
        expires_at: expiresAtUnixSeconds,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        metadata: {
          organization_id: input.organizationId,
          booking_id: input.bookingId,
          hold_minutes: String(PAYMENT_RULES.STRIPE_HOLD_MINUTES),
        },
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: input.currency.toLowerCase(),
              unit_amount: input.amountCents,
              product_data: { name: input.activityName },
            },
          },
        ],
      });
      if (!session.url) {
        return failAndLog({
          code: ERROR_CODES.PAYMENT_PROVIDER_ERROR,
          module: 'StripePaymentAdapter',
          fn: 'initiatePayment',
          cause: 'URL de redirection absente dans la réponse Stripe',
          received: 'null',
          expected: 'https://checkout.stripe.com/...',
        });
      }
      return ok({
        paymentReference: session.id,
        checkoutUrl: session.url,
        expiresAt: input.expiresAt,
      });
    } catch (rawError: unknown) {
      return failAndLog({
        code: ERROR_CODES.PAYMENT_PROVIDER_ERROR,
        module: 'StripePaymentAdapter',
        fn: 'initiatePayment',
        cause: 'Échec création session Stripe Checkout',
        received:
          rawError instanceof Error ? rawError.message : String(rawError),
        expected: 'session Stripe créée',
      });
    }
  }
  public async verifyWebhookAndParse(
    rawBody: string,
    signatureHeader: string,
  ): Promise<Result<ParsedWebhookPaymentEvent | null, AppError>> {
    try {
      const event = this.stripe.webhooks.constructEvent(
        rawBody,
        signatureHeader,
        this.webhookSecret,
      );
      if (event.type !== 'checkout.session.completed') return ok(null);
      const sessionObj = event.data.object;
      const bookingId = sessionObj.metadata?.['booking_id'];
      const paymentReference = sessionObj.payment_intent ?? sessionObj.id;
      if (!bookingId) {
        return failAndLog({
          code: ERROR_CODES.VALIDATION_FAILED,
          module: 'StripePaymentAdapter',
          fn: 'verifyWebhookAndParse',
          cause: 'metadata.booking_id manquant dans le webhook Stripe',
          received: JSON.stringify(sessionObj.metadata ?? {}),
          expected: 'metadata contenant booking_id',
        });
      }
      return ok({
        eventId: event.id,
        provider: PAYMENT_MODES.STRIPE,
        bookingId,
        paymentReference,
        amountPaidCents: sessionObj.amount_total ?? 0,
      });
    } catch (rawError: unknown) {
      return failAndLog({
        code: ERROR_CODES.UNAUTHORIZED,
        module: 'StripePaymentAdapter',
        fn: 'verifyWebhookAndParse',
        cause: 'Signature cryptographique du webhook Stripe invalide',
        received:
          rawError instanceof Error ? rawError.message : String(rawError),
        expected: 'signature Stripe HMAC valide',
      });
    }
  }
  public async refundPayment(
    input: RefundPaymentInput,
  ): Promise<Result<{ readonly refundId: string }, AppError>> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: input.paymentReference,
        amount: input.amountCents,
        reason: 'duplicate',
      });
      return ok({ refundId: refund.id });
    } catch (rawError: unknown) {
      return failAndLog({
        code: ERROR_CODES.PAYMENT_PROVIDER_ERROR,
        module: 'StripePaymentAdapter',
        fn: 'refundPayment',
        cause: 'Échec du remboursement automatique Stripe',
        received:
          rawError instanceof Error ? rawError.message : String(rawError),
        expected: 'refund.id retourné par Stripe',
      });
    }
  }
}
