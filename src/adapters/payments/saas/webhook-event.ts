import type Stripe from 'stripe';
import { z } from 'zod';
import { ok, type Result } from '../../../lib/result';
import { failure } from '../../../lib/errors';
import { ERROR_CODES } from '../../../config/constants';
export interface BillingEvent {
  readonly eventId: string;
  readonly organizationId: string;
  readonly subscriptionId: string;
}
export function billingEvent(event: Stripe.Event): Result<BillingEvent | null> {
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.mode !== 'subscription') return ok(null);
    const id =
      typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
    return parsed(event.id, session.metadata?.['organization_id'], id);
  }
  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    const subscription = event.data.object;
    return parsed(event.id, subscription.metadata['organization_id'], subscription.id);
  }
  return ok(null);
}
function parsed(
  eventId: string,
  organizationId: string | undefined,
  subscriptionId: string | undefined,
): Result<BillingEvent> {
  const organization = z.uuid().safeParse(organizationId);
  return organization.success && subscriptionId
    ? ok({ eventId, organizationId: organization.data, subscriptionId })
    : failure(ERROR_CODES.VALIDATION_FAILED, 'SubscriptionWebhook', 'metadata');
}
