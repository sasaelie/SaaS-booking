import { syncValues } from './sync-values';
import type Stripe from 'stripe';
import type { DrizzlePgDb } from '../../db/client';
import { atomic } from '../../db/transaction';
import { ERROR_CODES, TIME, ACCESS_STATUSES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
export function subscriptionValues(subscription: Stripe.Subscription, priceId: string) {
  const item = subscription.items.data.find((value) => value.price.id === priceId);
  if (!item) return failure(ERROR_CODES.VALIDATION_FAILED, 'Subscription', 'price');
  const customer =
    typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const status =
    subscription.status === 'active'
      ? ACCESS_STATUSES.ACTIVE
      : subscription.status === 'past_due' || subscription.status === 'unpaid'
        ? ACCESS_STATUSES.PAST_DUE
        : ACCESS_STATUSES.CANCELED;
  return ok({
    stripeCustomerId: customer,
    stripeSubscriptionId: subscription.id,
    status,
    currentPeriodEnd: new Date(item.current_period_end * TIME.SECOND_MS),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    updatedAt: new Date(),
  });
}
export async function syncSubscription(
  db: DrizzlePgDb,
  id: string,
  subscription: Stripe.Subscription,
  priceId: string,
) {
  const values = subscriptionValues(subscription, priceId);
  if (!values.ok) return values;
  return atomic(db, 'Subscription', (tx) => syncValues(tx, id, values.value));
}
