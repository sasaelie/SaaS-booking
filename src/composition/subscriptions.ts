import 'server-only';
import Stripe from 'stripe';
import type { Runtime } from './runtime';
import { StripeSubscriptionAdapter } from '../adapters/payments/stripe-subscription.adapter';
import { StripeSubscriptionWebhook } from '../adapters/payments/saas/webhook';
import { HandleSubscriptionWebhookUseCase } from '../core/use-cases/portal/subscription-webhook.use-case';
import { SAAS } from '../config/constants';
import { paymentsEnabled } from '../config/staging';
export function subscriptions(app: Runtime) {
  const env = app.env;
  const settings =
    paymentsEnabled(env) && env.STRIPE_SECRET_KEY && env.STRIPE_SAAS_PRICE_ID
      ? {
          stripe: new Stripe(env.STRIPE_SECRET_KEY, {
            timeout: SAAS.PROVIDER_TIMEOUT_MS,
            maxNetworkRetries: 1,
          }),
          priceId: env.STRIPE_SAAS_PRICE_ID,
          appUrl: env.NEXT_PUBLIC_APP_URL,
        }
      : null;
  return {
    gateway: new StripeSubscriptionAdapter(app.pool, settings),
    webhook: new HandleSubscriptionWebhookUseCase(
      new StripeSubscriptionWebhook(app.pool, settings, env.STRIPE_SAAS_WEBHOOK_SECRET),
    ),
  };
}
