import { ownerAccess, billingReturn, type BillingContext } from './context';
import { syncSubscription } from './sync';
import { checkout } from './checkout';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok, type Result } from '../../../lib/result';
export async function changeRenewal(
  context: BillingContext,
  cancel: boolean,
): Promise<Result<{ readonly url: string | null }>> {
  const access = await ownerAccess(context);
  if (!access.ok) return access;
  if (!access.value.stripeSubscriptionId) {
    if (cancel || access.value.complimentary)
      return failure(ERROR_CODES.CONFLICT, 'Subscription', 'no-subscription');
    return checkout(context);
  }
  const current = await context.stripe.subscriptions.retrieve(access.value.stripeSubscriptionId);
  const customer = typeof current.customer === 'string' ? current.customer : current.customer.id;
  if (customer !== access.value.stripeCustomerId)
    return failure(ERROR_CODES.UNAUTHORIZED, 'Subscription', 'customer');
  if (current.status === 'canceled' || current.status === 'incomplete_expired')
    return cancel ? ok({ url: null }) : checkout(context);
  const updated = await context.stripe.subscriptions.update(current.id, {
    cancel_at_period_end: cancel,
  });
  const synced = await syncSubscription(
    context.db,
    context.organizationId,
    updated,
    context.priceId,
  );
  return synced.ok ? ok({ url: null }) : synced;
}
export async function billingPortal(context: BillingContext) {
  const access = await ownerAccess(context);
  if (!access.ok) return access;
  if (!access.value.stripeCustomerId)
    return failure(ERROR_CODES.NOT_FOUND, 'Subscription', 'customer');
  const result = await context.stripe.billingPortal.sessions.create({
    customer: access.value.stripeCustomerId,
    return_url: billingReturn(context),
  });
  return ok({ url: result.url });
}
