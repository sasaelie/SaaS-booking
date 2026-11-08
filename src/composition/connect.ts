import { ConnectedAccountWebhookUseCase } from '../core/use-cases/portal/connected-account-webhook.use-case';
import { StripeConnectWebhookAdapter } from '../adapters/payments/stripe-connect-webhook.adapter';
import { HandlePaymentWebhookUseCase } from '../core/use-cases/handle-stripe-webhook.use-case';
import { DrizzlePaymentRepository } from '../adapters/db/drizzle-payment.repository';
import { StripePaymentAdapter } from '../adapters/payments/stripe-payment.adapter';
import { unavailablePayment } from './unavailable';
import type { Runtime } from './runtime';
import Stripe from 'stripe';
import { StripeConnectAdapter } from '../adapters/payments/stripe-connect.adapter';
import { SAAS } from '../config/constants';
export function connectGateway(app: Runtime) {
  const env = app.env;
  const settings = env.STRIPE_SECRET_KEY
    ? {
        stripe: new Stripe(env.STRIPE_SECRET_KEY, {
          timeout: SAAS.PROVIDER_TIMEOUT_MS,
          maxNetworkRetries: 1,
        }),
        clientId: env.STRIPE_CONNECT_CLIENT_ID,
        appUrl: env.NEXT_PUBLIC_APP_URL,
      }
    : null;
  return new StripeConnectAdapter(app.db, settings);
}

export function connectedWebhook(app: Runtime) {
  const secret = app.env.STRIPE_CONNECT_WEBHOOK_SECRET;
  const stripe = app.env.STRIPE_SECRET_KEY
    ? new Stripe(app.env.STRIPE_SECRET_KEY, {
        timeout: SAAS.PROVIDER_TIMEOUT_MS,
        maxNetworkRetries: 1,
      })
    : null;
  return new ConnectedAccountWebhookUseCase(
    new StripeConnectWebhookAdapter(app.db, stripe, secret),
    new HandlePaymentWebhookUseCase({
      paymentRepo: new DrizzlePaymentRepository(app.db),
      paymentGateway:
        stripe && secret ? new StripePaymentAdapter(stripe, secret) : unavailablePayment,
    }),
  );
}
