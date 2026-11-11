import { expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from './database';
import { financialFixture, pay } from './financial-fixtures';
import { portalFixture } from './portal-fixtures';
import { financialPayments, financialEntries } from '../../src/adapters/db/schema';
import { organizationAccess } from '../../src/adapters/db/schema/saas';
import { reconcileFinancial } from '../../src/adapters/jobs/reconcile-financial';
import { required } from '../../src/adapters/db/transaction';
import { ok } from '../../src/lib/result';
import type { PaymentGatewayPort } from '../../src/core/ports/payment-gateway.port';
function gateway(id: string, available = true): PaymentGatewayPort {
  return {
    mode: 'STRIPE',
    initiatePayment: async () => {
      throw Error('Unused');
    },
    refundPayment: async () => {
      throw Error('Unused');
    },
    verifyWebhookAndParse: async () => ok(null),
    reconcilePayment: async () =>
      ok(
        available
          ? {
              chargeId: `ch_${id}`,
              balanceTransactionId: `txn_${id}`,
              amountCents: 3000,
              stripeFeeCents: 70,
              currency: 'EUR',
              transferId: `tr_${id}`,
              refundedCents: 0,
            }
          : null,
      ),
  };
}
it('keeps unknown bank fees pending, reconciles actuals once and isolates the net counter', async () => {
  const context = await financialFixture();
  const booking = await pay(context);
  let summary = required(await context.financial.summary(context.actor, context.organizationId));
  expect(summary).toMatchObject({ avoidableCents: 0, pendingCount: 1 });
  const pending = await reconcileFinancial(db, gateway(booking.bookingId, false), {
    bookingId: booking.bookingId,
  });
  expect(pending.ok).toBe(false);
  required(
    await reconcileFinancial(db, gateway(booking.bookingId), { bookingId: booking.bookingId }),
  );
  required(
    await reconcileFinancial(db, gateway(booking.bookingId), { bookingId: booking.bookingId }),
  );
  summary = required(await context.financial.summary(context.actor, context.organizationId));
  expect(summary).toMatchObject({
    commissionCents: 150,
    stripeFeeCents: 70,
    avoidableCents: 80,
    pendingCount: 0,
  });
  const [payment] = await db.select().from(financialPayments);
  expect(payment).toMatchObject({
    publicAmountCents: 3000,
    organizationNetCents: 2850,
    commissionCents: 150,
  });
  expect(await db.select().from(financialEntries)).toHaveLength(2);
});
it('refuses cross-tenant reads and exports and rejects direct Pro export calls in Liberty', async () => {
  const context = await financialFixture();
  await pay(context);
  const other = await portalFixture();
  expect((await context.financial.summary(other.actor, context.organizationId)).ok).toBe(false);
  expect((await context.financial.export(other.actor, context.organizationId)).ok).toBe(false);
  expect((await context.financial.export(context.actor, context.organizationId)).ok).toBe(false);
  await db
    .update(organizationAccess)
    .set({ complimentary: true })
    .where(eq(organizationAccess.organizationId, context.organizationId));
  const csv = required(await context.financial.export(context.actor, context.organizationId));
  expect(csv).toContain('PENDING');
  expect(csv).not.toContain('test@example.com');
});
it('does not include participant ticket volume in platform income', async () => {
  const context = await financialFixture();
  const booking = await pay(context);
  required(
    await reconcileFinancial(db, gateway(booking.bookingId), { bookingId: booking.bookingId }),
  );
  const operator = await portalFixture(true);
  const overview = required(
    await operator.repository.platform(operator.actor, { search: '', page: 1 }),
  );
  expect(overview.financial).toMatchObject({
    bookingVolumeCents: 3000,
    commissionGrossCents: 150,
    commissionNetCents: 80,
    subscriptionCents: 0,
  });
  await db.execute(
    sql`INSERT INTO financial_entries(organization_id,source_key,kind,amount_cents) VALUES(${context.organizationId},'invoice:test','SUBSCRIPTION',2900)`,
  );
  const updated = required(
    await operator.repository.platform(operator.actor, { search: '', page: 1 }),
  );
  expect(updated.financial?.subscriptionCents).toBe(2900);
});
