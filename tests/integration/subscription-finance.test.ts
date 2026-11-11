import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, pool } from './database';
import { portalFixture } from './portal-fixtures';
import { billingStripe } from './billing-fixtures';
import { StripeSubscriptionWebhook } from '../../src/adapters/payments/saas/webhook';
import { organizationAccess } from '../../src/adapters/db/schema/saas';
import { financialEntries } from '../../src/adapters/db/schema';
import { required } from '../../src/adapters/db/transaction';
const secret = 'whsec_subscription_finance';
async function context() {
  const owner = await portalFixture();
  const mock = billingStripe();
  mock.state.organizationId = owner.organizationId;
  await db
    .update(organizationAccess)
    .set({ stripeCustomerId: 'cus_local' })
    .where(eq(organizationAccess.organizationId, owner.organizationId));
  const handler = new StripeSubscriptionWebhook(pool, mock.settings, secret);
  async function send(type: string, object: unknown) {
    const body = JSON.stringify({ id: crypto.randomUUID(), type, data: { object } });
    return handler.handle(
      body,
      mock.stripe.webhooks.generateTestHeaderString({ payload: body, secret }),
    );
  }
  return { ...owner, ...mock, send };
}
it('records a paid subscription invoice once and never confuses it with participant ticket volume', async () => {
  const input = await context();
  const invoice = {
    id: 'in_local',
    status: 'paid',
    customer: 'cus_local',
    currency: 'eur',
    amount_paid: 2900,
    parent: { subscription_details: { subscription: 'sub_current' } },
    created: Math.floor(Date.now() / 1000),
    status_transitions: { paid_at: Math.floor(Date.now() / 1000) },
  };
  required(await input.send('invoice.paid', invoice));
  required(await input.send('invoice.paid', invoice));
  expect(await db.select().from(financialEntries)).toHaveLength(1);
  expect((await db.select().from(financialEntries))[0]).toMatchObject({
    kind: 'SUBSCRIPTION',
    amountCents: 2900,
  });
});
it('records successful subscription refunds by refund id without double subtraction', async () => {
  const input = await context();
  input.state.refunded = true;
  const charge = {
    id: 'ch_subscription',
    payment_intent: 'pi_subscription',
    amount_refunded: 2900,
  };
  required(await input.send('charge.refunded', charge));
  required(await input.send('charge.refunded', charge));
  const entries = await db.select().from(financialEntries);
  expect(entries).toHaveLength(2);
  expect(entries.reduce((sum, entry) => sum + entry.amountCents, 0)).toBe(0);
});
