import { sql } from 'drizzle-orm';
import { financialPayments, financialEntries, platformCosts } from './schema';
import type { Executor } from './transaction';
export async function platformFinance(db: Executor) {
  const [payments] = await db
    .select({
      bookingVolumeCents: sql<number>`COALESCE(sum(public_amount_cents-refunded_cents) FILTER(WHERE paid_at IS NOT NULL),0)::int`,
      commissionGrossCents: sql<number>`COALESCE(sum(commission_cents-commission_refunded_cents) FILTER(WHERE paid_at IS NOT NULL AND commercial_plan='LIBERTE' AND status='RECONCILED'),0)::int`,
      stripeFeeCents: sql<number>`COALESCE(sum(stripe_fee_cents) FILTER(WHERE paid_at IS NOT NULL AND commercial_plan='LIBERTE' AND status='RECONCILED'),0)::int`,
      pendingCount: sql<number>`count(*) FILTER(WHERE paid_at IS NOT NULL AND status='PENDING')::int`,
    })
    .from(financialPayments);
  const [subscriptions] = await db
    .select({
      subscriptionCents: sql<number>`COALESCE(sum(amount_cents) FILTER(WHERE kind='SUBSCRIPTION'),0)::int`,
    })
    .from(financialEntries);
  const value = payments ?? {
    bookingVolumeCents: 0,
    commissionGrossCents: 0,
    stripeFeeCents: 0,
    pendingCount: 0,
  };
  const [costs] = await db
    .select({ otherCostsCents: sql<number>`COALESCE(sum(amount_cents),0)::int` })
    .from(platformCosts);
  return {
    ...value,
    subscriptionCents: subscriptions?.subscriptionCents ?? 0,
    otherCostsCents: costs?.otherCostsCents ?? 0,
    commissionNetCents:
      value.commissionGrossCents - value.stripeFeeCents - (costs?.otherCostsCents ?? 0),
  };
}
