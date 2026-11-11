import { recordSubscriptionInvoice } from './invoice';
import { recordSubscriptionRefund } from './refund';
import type { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import type { SubscriptionWebhookPort } from '../../../core/ports/subscription-webhook.port';
import { ok, type Result } from '../../../lib/result';
import { failure } from '../../../lib/errors';
import { ERROR_CODES } from '../../../config/constants';
import { atomic, rows, required } from '../../db/transaction';
import type { DrizzlePgDb } from '../../db/client';
import { billingEvent, type BillingEvent } from './webhook-event';
import { billingLock } from './lock';
import { subscriptionValues } from './sync';
import { syncValues } from './sync-values';
import { acceptedPrices, type BillingSettings } from './context';
async function applyEvent(db: DrizzlePgDb, event: BillingEvent, settings: BillingSettings) {
  const existing = await rows(
    db,
    sql`SELECT event_id FROM saas_billing_events WHERE event_id=${event.eventId}`,
  );
  if (existing.length) return ok(undefined);
  const subscription = await settings.stripe.subscriptions.retrieve(event.subscriptionId);
  const values = subscriptionValues(subscription, acceptedPrices(settings));
  if (!values.ok) return values;
  return atomic(db, 'SubscriptionWebhook', async (tx) => {
    required(await syncValues(tx, event.organizationId, values.value));
    await tx.execute(
      sql`INSERT INTO saas_billing_events(event_id,organization_id) VALUES(${event.eventId},${event.organizationId}) ON CONFLICT DO NOTHING`,
    );
    return ok(undefined);
  });
}
export class StripeSubscriptionWebhook implements SubscriptionWebhookPort {
  constructor(
    private readonly pool: Pool,
    private readonly settings: BillingSettings | null,
    private readonly secret: string | undefined,
  ) {}
  async handle(body: string, signature: string): Promise<Result<void>> {
    const settings = this.settings;
    if (!settings || !this.secret)
      return failure(ERROR_CODES.CONFIGURATION_ERROR, 'SubscriptionWebhook', 'configuration');
    let event;
    try {
      event = settings.stripe.webhooks.constructEvent(body, signature, this.secret);
    } catch {
      return failure(ERROR_CODES.UNAUTHORIZED, 'SubscriptionWebhook', 'signature');
    }
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      return billingLock(this.pool, invoice.id, (db) =>
        recordSubscriptionInvoice(db, invoice, settings),
      );
    }
    if (event.type === 'charge.refunded' && !event.account) {
      const charge = event.data.object;
      return billingLock(this.pool, charge.id, (db) =>
        recordSubscriptionRefund(db, charge, settings),
      );
    }
    const parsed = billingEvent(event);
    if (!parsed.ok) return parsed;
    const payment = parsed.value;
    return payment
      ? billingLock(this.pool, payment.organizationId, (db) => applyEvent(db, payment, settings))
      : ok(undefined);
  }
}
