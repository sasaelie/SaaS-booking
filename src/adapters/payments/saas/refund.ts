import type Stripe from 'stripe';
import { and, eq } from 'drizzle-orm';
import { organizationAccess } from '../../db/schema/saas';
import { financialEntries } from '../../db/schema';
import { atomic } from '../../db/transaction';
import type { DrizzlePgDb } from '../../db/client';
import { acceptedPrices, type BillingSettings } from './context';
import { recordSubscriptionInvoice } from './invoice';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
import { ERROR_CODES, SAAS, TIME } from '../../../config/constants';
export async function recordSubscriptionRefund(
  db: DrizzlePgDb,
  charge: Stripe.Charge,
  settings: BillingSettings,
) {
  const intent =
    typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id;
  if (!intent) return ok(undefined);
  const payments = await settings.stripe.invoicePayments.list({
    payment: { type: 'payment_intent', payment_intent: intent },
    limit: SAAS.PAGE_SIZE,
  });
  if (!payments.data.length) return ok(undefined);
  if (payments.data.length !== 1 || payments.has_more)
    return failure(ERROR_CODES.CONFLICT, 'SubscriptionRefund', 'allocation');
  const reference = payments.data[0]?.invoice;
  if (!reference) return ok(undefined);
  const invoice = await settings.stripe.invoices.retrieve(
    typeof reference === 'string' ? reference : reference.id,
  );
  const organizationId = await invoiceOrganization(settings, invoice);
  if (!organizationId || invoice.currency !== 'eur')
    return failure(ERROR_CODES.VALIDATION_FAILED, 'SubscriptionRefund', 'scope');
  const recorded = await recordSubscriptionInvoice(db, invoice, settings);
  if (!recorded.ok) return recorded;
  for await (const refund of settings.stripe.refunds.list({
    charge: charge.id,
    limit: SAAS.PAGE_SIZE,
  })) {
    if (refund.status !== 'succeeded') continue;
    const saved = await storeRefund(db, organizationId, invoice, refund);
    if (!saved.ok) return saved;
  }
  return ok(undefined);
}
function storeRefund(
  db: DrizzlePgDb,
  organizationId: string,
  invoice: Stripe.Invoice,
  refund: Stripe.Refund,
) {
  return atomic(db, 'SubscriptionRefund', async (tx) => {
    const customer = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
    const [access] = await tx
      .select()
      .from(organizationAccess)
      .where(
        and(
          eq(organizationAccess.organizationId, organizationId),
          customer ? eq(organizationAccess.stripeCustomerId, customer) : undefined,
        ),
      );
    if (!customer || !access)
      return failure(ERROR_CODES.UNAUTHORIZED, 'SubscriptionRefund', 'customer');
    await tx
      .insert(financialEntries)
      .values({
        organizationId,
        kind: 'SUBSCRIPTION',
        sourceKey: `subscription-refund:${refund.id}`,
        amountCents: -refund.amount,
        reference: refund.id,
        createdAt: new Date(refund.created * TIME.SECOND_MS),
      })
      .onConflictDoNothing();
    return ok(undefined);
  });
}

async function invoiceOrganization(settings: BillingSettings, invoice: Stripe.Invoice) {
  const ref = invoice.parent?.subscription_details?.subscription;
  if (!ref) return null;
  const subscription = await settings.stripe.subscriptions.retrieve(
    typeof ref === 'string' ? ref : ref.id,
  );
  if (!subscription.items.data.some((item) => acceptedPrices(settings).includes(item.price.id)))
    return null;
  return subscription.metadata['organization_id'] ?? null;
}
