import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import type { ConnectAccountWebhookPort } from '../../core/ports/connect-gateway.port';
import type { DrizzlePgDb } from '../db/client';
import { organizations } from '../db/schema';
import { atomic } from '../db/transaction';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
export class StripeConnectWebhookAdapter implements ConnectAccountWebhookPort {
  constructor(
    private readonly db: DrizzlePgDb,
    private readonly stripe: Stripe | null,
    private readonly secret: string | undefined,
  ) {}
  async handle(body: string, signature: string): Promise<Result<void>> {
    if (!this.stripe || !this.secret)
      return failure(ERROR_CODES.CONFIGURATION_ERROR, 'ConnectWebhook', 'configuration');
    let event;
    try {
      event = this.stripe.webhooks.constructEvent(body, signature, this.secret);
    } catch {
      return failure(ERROR_CODES.UNAUTHORIZED, 'ConnectWebhook', 'signature');
    }
    if (event.type !== 'account.updated' && event.type !== 'account.application.deauthorized')
      return ok(undefined);
    const id = event.account;
    if (!id) return failure(ERROR_CODES.VALIDATION_FAILED, 'ConnectWebhook', 'account');
    let ready = false;
    if (event.type === 'account.updated') {
      try {
        const account = await this.stripe.accounts.retrieve(id);
        ready = Boolean(account.charges_enabled && account.details_submitted);
      } catch {
        return failure(ERROR_CODES.PAYMENT_PROVIDER_ERROR, 'ConnectWebhook', 'account');
      }
    }
    return atomic(this.db, 'ConnectWebhook', async (tx) => {
      await tx
        .update(organizations)
        .set({ stripeReady: ready })
        .where(eq(organizations.merchantAccountId, id));
      return ok(undefined);
    });
  }
}
