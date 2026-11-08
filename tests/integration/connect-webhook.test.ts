import { expect, it } from 'vitest';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { portalFixture } from './portal-fixtures';
import { organizations } from '../../src/adapters/db/schema';
import { StripeConnectWebhookAdapter } from '../../src/adapters/payments/stripe-connect-webhook.adapter';
import { required } from '../../src/adapters/db/transaction';
it('updates connected payment readiness from canonical account state and disables a deauthorized account', async () => {
  const owner = await portalFixture();
  await db
    .update(organizations)
    .set({ merchantAccountId: 'acct_local' })
    .where(eq(organizations.id, owner.organizationId));
  const stripe = new Stripe('sk_test_local', {
    httpClient: Stripe.createFetchHttpClient(
      async () =>
        new Response(
          JSON.stringify({ id: 'acct_local', charges_enabled: true, details_submitted: true }),
          { status: 200 },
        ),
    ),
    maxNetworkRetries: 0,
  });
  const secret = 'whsec_connect_local';
  const handler = new StripeConnectWebhookAdapter(db, stripe, secret);
  function event(type: string) {
    const body = JSON.stringify({
      id: crypto.randomUUID(),
      account: 'acct_local',
      type,
      data: { object: { id: 'acct_local', charges_enabled: false } },
    });
    return { body, signature: stripe.webhooks.generateTestHeaderString({ payload: body, secret }) };
  }
  const update = event('account.updated');
  expect((await handler.handle(update.body, 'forged')).ok).toBe(false);
  required(await handler.handle(update.body, update.signature));
  expect(
    required(await owner.repository.getOrganization(owner.actor, owner.organizationId)).stripeReady,
  ).toBe(true);
  const revoke = event('account.application.deauthorized');
  required(await handler.handle(revoke.body, revoke.signature));
  expect(
    required(await owner.repository.getOrganization(owner.actor, owner.organizationId)).stripeReady,
  ).toBe(false);
});
