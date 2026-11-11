import 'server-only';
import Stripe from 'stripe';
import type { Runtime } from './runtime';
import { StripeFinancialWebhook } from '../adapters/payments/stripe-financial-webhook';
import { paymentsEnabled } from '../config/staging';
import { failure } from '../lib/errors';
import { ERROR_CODES } from '../config/constants';
export function financialWebhook(app: Runtime, body: string, signature: string, connected = false) {
  const env = app.env;
  const secret = connected ? env.STRIPE_CONNECT_WEBHOOK_SECRET : env.STRIPE_WEBHOOK_SECRET;
  if (!paymentsEnabled(env) || !env.STRIPE_SECRET_KEY || !secret)
    return Promise.resolve(
      failure(ERROR_CODES.CONFIGURATION_ERROR, 'FinancialWebhook', 'configuration'),
    );
  return new StripeFinancialWebhook(app.db, new Stripe(env.STRIPE_SECRET_KEY), secret).handle(
    body,
    signature,
  );
}
