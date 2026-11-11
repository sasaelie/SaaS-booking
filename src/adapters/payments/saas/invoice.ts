import type Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { financialEntries } from '../../db/schema';
import { organizationAccess } from '../../db/schema/saas';
import { atomic } from '../../db/transaction';
import type { DrizzlePgDb } from '../../db/client';
import { acceptedPrices, type BillingSettings } from './context';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
import { ERROR_CODES, TIME } from '../../../config/constants';
export async function recordSubscriptionInvoice(
  db: DrizzlePgDb,
  invoice: Stripe.Invoice,
  settings: BillingSettings,
) {
  const ref = invoice.parent?.subscription_details?.subscription;
  if (!ref || invoice.status !== 'paid') return ok(undefined);
  const subscription = await settings.stripe.subscriptions.retrieve(
    typeof ref === 'string' ? ref : ref.id,
  );
  if (!subscription.items.data.some((item) => acceptedPrices(settings).includes(item.price.id)))
    return ok(undefined);
  const id = subscription.metadata['organization_id'];
  if (!id || invoice.currency !== 'eur')
    return failure(ERROR_CODES.VALIDATION_FAILED, 'SubscriptionInvoice', 'scope');
  return atomic(db, 'SubscriptionInvoice', async (tx) => {
    const [access] = await tx
      .select()
      .from(organizationAccess)
      .where(eq(organizationAccess.organizationId, id));
    const customer = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    if (!access || access.stripeCustomerId !== customer)
      return failure(ERROR_CODES.UNAUTHORIZED, 'SubscriptionInvoice', 'customer');
    await tx
      .insert(financialEntries)
      .values({
        organizationId: id,
        sourceKey: `subscription:${invoice.id}`,
        kind: 'SUBSCRIPTION',
        amountCents: invoice.amount_paid,
        reference: invoice.id,
        createdAt: new Date(
          (invoice.status_transitions.paid_at ?? invoice.created) * TIME.SECOND_MS,
        ),
      })
      .onConflictDoNothing();
    return ok(undefined);
  });
}
