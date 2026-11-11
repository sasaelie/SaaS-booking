import { eq } from 'drizzle-orm';
import { organizationAccess } from '../../db/schema/saas';
import {
  ownerAccess,
  billingReturn,
  type BillingContext,
  type BillingAccess,
  selectedPrice,
  acceptedPrices,
} from './context';
import { syncSubscription } from './sync';
import { COMMERCIAL } from '../../../config/commercial';
import { ERROR_CODES, SAAS } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
async function customerId(context: BillingContext, access: BillingAccess) {
  if (access.stripeCustomerId) return access.stripeCustomerId;
  const customer = await context.stripe.customers.create(
    { metadata: { organization_id: context.organizationId } },
    { idempotencyKey: `saas-customer:${context.organizationId}` },
  );
  await context.db
    .update(organizationAccess)
    .set({ stripeCustomerId: customer.id })
    .where(eq(organizationAccess.organizationId, context.organizationId));
  return customer.id;
}
async function createCheckout(context: BillingContext, customer: string) {
  const priceId = selectedPrice(context);
  if (!priceId) return failure(ERROR_CODES.CONFIGURATION_ERROR, 'Subscription', 'annual-price');
  const price = await context.stripe.prices.retrieve(priceId);
  if (
    price.unit_amount !==
      (context.interval === 'year' ? COMMERCIAL.ANNUAL_CENTS : COMMERCIAL.MONTHLY_CENTS) ||
    price.currency !== SAAS.CURRENCY.toLowerCase() ||
    price.recurring?.interval !== (context.interval ?? 'month') ||
    price.recurring.interval_count !== SAAS.INTERVAL_COUNT
  )
    return failure(ERROR_CODES.CONFIGURATION_ERROR, 'Subscription', 'configured-price');
  const previous = await openCheckout(context, customer);
  if (previous?.url)
    return previous.metadata?.['billing_interval'] === (context.interval ?? 'month')
      ? ok({ url: previous.url })
      : failure(ERROR_CODES.CONFLICT, 'Subscription', 'checkout-already-open');
  const session = await context.stripe.checkout.sessions.create(
    {
      mode: 'subscription',
      customer,
      line_items: [{ price: priceId, quantity: 1 }],
      billing_address_collection: 'required',
      metadata: {
        organization_id: context.organizationId,
        billing_interval: context.interval ?? 'month',
      },
      subscription_data: { metadata: { organization_id: context.organizationId } },
      success_url: `${billingReturn(context)}?retour=paiement`,
      cancel_url: billingReturn(context),
    },
    {
      idempotencyKey: `saas-checkout:${context.organizationId}:${context.interval ?? 'month'}:${Math.floor(Date.now() / SAAS.CHECKOUT_BUCKET_MS)}`,
    },
  );
  return session.url
    ? ok({ url: session.url })
    : failure(ERROR_CODES.PAYMENT_PROVIDER_ERROR, 'Subscription', 'checkout-url');
}
export async function checkout(context: BillingContext) {
  const result = await ownerAccess(context);
  if (!result.ok) return result;
  if (result.value.complimentary || result.value.suspendedAt)
    return failure(ERROR_CODES.CONFLICT, 'Subscription', 'access');
  const customer = await customerId(context, result.value);
  const list = await context.stripe.subscriptions.list({
    customer,
    status: 'all',
    limit: SAAS.PAGE_SIZE,
  });
  const existing = list.data.find(
    (subscription) =>
      !['canceled', 'incomplete_expired'].includes(subscription.status) &&
      subscription.items.data.some((item) => acceptedPrices(context).includes(item.price.id)),
  );
  if (existing) {
    const synced = await syncSubscription(
      context.db,
      context.organizationId,
      existing,
      acceptedPrices(context),
    );
    if (!synced.ok) return synced;
    const portal = await context.stripe.billingPortal.sessions.create({
      customer,
      return_url: billingReturn(context),
    });
    return ok({ url: portal.url });
  }
  return createCheckout(context, customer);
}

async function openCheckout(context: BillingContext, customer: string) {
  const open = await context.stripe.checkout.sessions.list({
    customer,
    status: 'open',
    limit: SAAS.PAGE_SIZE,
  });
  return open.data.find(
    (session) =>
      session.mode === 'subscription' &&
      session.metadata?.['organization_id'] === context.organizationId,
  );
}
