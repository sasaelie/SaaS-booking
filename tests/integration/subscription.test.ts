import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db, pool } from './database';
import { portalFixture } from './portal-fixtures';
import { billingStripe } from './billing-fixtures';
import { StripeSubscriptionAdapter } from '../../src/adapters/payments/stripe-subscription.adapter';
import { organizationAccess } from '../../src/adapters/db/schema/saas';
import { required } from '../../src/adapters/db/transaction';
import { hasCommercialAccess } from '../../src/core/domain/subscription-access';
async function activeSubscription() {
  const owner = await portalFixture();
  const mock = billingStripe();
  mock.state.organizationId = owner.organizationId;
  mock.state.hasSubscription = true;
  await db
    .update(organizationAccess)
    .set({
      stripeCustomerId: 'cus_local',
      stripeSubscriptionId: 'sub_current',
      status: 'ACTIVE',
      currentPeriodEnd: new Date(mock.state.period * 1000),
    })
    .where(eq(organizationAccess.organizationId, owner.organizationId));
  return { ...owner, ...mock, gateway: new StripeSubscriptionAdapter(pool, mock.settings) };
}
it('cancels only renewal and reactivates without creating another charge or extending the paid period', async () => {
  const context = await activeSubscription();
  const { gateway, actor, organizationId, state } = context;
  required(await gateway.cancel(actor, organizationId));
  const cancelled = required(await context.repository.getOrganization(actor, organizationId));
  expect(cancelled.access.cancelAtPeriodEnd).toBe(true);
  expect(cancelled.access.currentPeriodEnd?.getTime()).toBe(state.period * 1000);
  expect(hasCommercialAccess(cancelled.access, new Date())).toBe(true);
  required(await gateway.reactivate(actor, organizationId));
  const restored = required(await context.repository.getOrganization(actor, organizationId));
  expect(restored.access.cancelAtPeriodEnd).toBe(false);
  expect(restored.access.currentPeriodEnd?.getTime()).toBe(state.period * 1000);
  expect(state.checkoutCount).toBe(0);
  const stranger = await portalFixture();
  expect((await gateway.cancel(stranger.actor, organizationId)).ok).toBe(false);
});
it('reuses an open checkout and customer and refuses an incorrect monthly price', async () => {
  const owner = await portalFixture();
  const mock = billingStripe();
  mock.state.organizationId = owner.organizationId;
  const gateway = new StripeSubscriptionAdapter(pool, mock.settings);
  required(await gateway.checkout(owner.actor, owner.organizationId));
  required(await gateway.checkout(owner.actor, owner.organizationId));
  expect(mock.state.customerCount).toBe(1);
  expect(mock.state.checkoutCount).toBe(1);
  mock.state.unitAmount = 2000;
  expect((await gateway.checkout(owner.actor, owner.organizationId)).ok).toBe(false);
  expect(mock.state.checkoutCount).toBe(1);
});
it('serializes concurrent checkout requests rather than creating duplicate subscriptions', async () => {
  const owner = await portalFixture();
  const mock = billingStripe();
  mock.state.organizationId = owner.organizationId;
  const gateway = new StripeSubscriptionAdapter(pool, mock.settings);
  const results = await Promise.all(
    Array.from({ length: 10 }, () => gateway.checkout(owner.actor, owner.organizationId)),
  );
  expect(results.some((result) => result.ok)).toBe(true);
  expect(mock.state.customerCount).toBe(1);
  expect(mock.state.checkoutCount).toBe(1);
});
it('validates the annual price and does not open two different subscription checkouts', async () => {
  const owner = await portalFixture();
  const mock = billingStripe();
  mock.state.organizationId = owner.organizationId;
  const gateway = new StripeSubscriptionAdapter(pool, {
    ...mock.settings,
    annualPriceId: 'price_annual',
  });
  required(await gateway.checkout(owner.actor, owner.organizationId, 'year'));
  const body = new URLSearchParams(mock.state.lastCheckoutBody);
  expect(body.get('line_items[0][price]')).toBe('price_annual');
  expect(body.get('metadata[billing_interval]')).toBe('year');
  expect((await gateway.checkout(owner.actor, owner.organizationId, 'month')).ok).toBe(false);
  expect(mock.state.checkoutCount).toBe(1);
});
