import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, pool } from './database';
import { portalFixture } from './portal-fixtures';
import { billingStripe } from './billing-fixtures';
import { StripeSubscriptionWebhook } from '../../src/adapters/payments/saas/webhook';
import { organizationAccess } from '../../src/adapters/db/schema/saas';
import { required } from '../../src/adapters/db/transaction';
const secret = 'whsec_local_billing';
async function webhookFixture() {
  const owner = await portalFixture();
  const mock = billingStripe();
  mock.state.organizationId = owner.organizationId;
  await db
    .update(organizationAccess)
    .set({ stripeCustomerId: 'cus_local' })
    .where(eq(organizationAccess.organizationId, owner.organizationId));
  const handler = new StripeSubscriptionWebhook(pool, mock.settings, secret);
  function event(id: string, subscriptionId = 'sub_current') {
    const body = JSON.stringify({
      id,
      type: 'customer.subscription.updated',
      data: { object: { id: subscriptionId, metadata: { organization_id: owner.organizationId } } },
    });
    return {
      body,
      signature: mock.stripe.webhooks.generateTestHeaderString({ payload: body, secret }),
    };
  }
  return { ...owner, ...mock, handler, event };
}
it('authenticates billing events, ignores duplicates and uses live provider state rather than stale payloads', async () => {
  const context = await webhookFixture();
  const event = context.event('evt_local');
  expect((await context.handler.handle(event.body, 'forged')).ok).toBe(false);
  required(await context.handler.handle(event.body, event.signature));
  context.state.subscriptionStatus = 'canceled';
  required(await context.handler.handle(event.body, event.signature));
  let org = required(
    await context.repository.getOrganization(context.actor, context.organizationId),
  );
  expect(org.access.status).toBe('ACTIVE');
  const fresh = context.event('evt_fresh');
  required(await context.handler.handle(fresh.body, fresh.signature));
  org = required(await context.repository.getOrganization(context.actor, context.organizationId));
  expect(org.access.status).toBe('CANCELED');
});
it('prevents an old subscription from replacing a current paid subscription', async () => {
  const context = await webhookFixture();
  await db
    .update(organizationAccess)
    .set({
      stripeSubscriptionId: 'sub_new',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(Date.now() + 2592000000),
    })
    .where(eq(organizationAccess.organizationId, context.organizationId));
  context.state.subscriptionId = 'sub_old';
  context.state.subscriptionStatus = 'canceled';
  const event = context.event('evt_old', 'sub_old');
  required(await context.handler.handle(event.body, event.signature));
  const org = required(
    await context.repository.getOrganization(context.actor, context.organizationId),
  );
  expect(org.access.status).toBe('ACTIVE');
  const [access] = await db
    .select()
    .from(organizationAccess)
    .where(eq(organizationAccess.organizationId, context.organizationId));
  expect(access?.stripeSubscriptionId).toBe('sub_new');
});
