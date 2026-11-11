import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { financialFixture, pay } from './financial-fixtures';
import { financialPayments, financialEntries } from '../../src/adapters/db/schema';
import { organizationAccess } from '../../src/adapters/db/schema/saas';
import { reconcileFinancial } from '../../src/adapters/jobs/reconcile-financial';
import { required } from '../../src/adapters/db/transaction';
import { ok } from '../../src/lib/result';
import type { PaymentGatewayPort } from '../../src/core/ports/payment-gateway.port';
function gateway(id: string, refunded: number, commission: number): PaymentGatewayPort {
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
      ok({
        chargeId: `ch_${id}`,
        balanceTransactionId: `txn_${id}`,
        amountCents: 3000,
        stripeFeeCents: 70,
        currency: 'EUR',
        transferId: null,
        refundedCents: refunded,
        commissionRefundedCents: commission,
        refunds:
          refunded === 3000
            ? [
                { id: `re_first_${id}`, amountCents: 1500 },
                { id: `re_second_${id}`, amountCents: 1500 },
              ]
            : [{ id: `re_first_${id}`, amountCents: 1500 }],
      }),
  };
}
it.each([false, true])(
  'preserves exact remaining net and inverse entries after partial and total refunds (Pro=%s)',
  async (pro) => {
    const owner = await financialFixture();
    await db
      .update(organizationAccess)
      .set({ complimentary: pro })
      .where(eq(organizationAccess.organizationId, owner.organizationId));
    const booking = await pay(owner);
    const payload = { bookingId: booking.bookingId };
    required(await reconcileFinancial(db, gateway(booking.bookingId, 1500, pro ? 0 : 75), payload));
    const [partial] = await db.select().from(financialPayments);
    expect(partial?.organizationNetCents).toBe(pro ? 1430 : 1425);
    const complete = gateway(booking.bookingId, 3000, pro ? 0 : 150);
    required(await reconcileFinancial(db, complete, payload));
    required(await reconcileFinancial(db, complete, payload));
    const [payment] = await db.select().from(financialPayments);
    expect(payment?.organizationNetCents).toBe(pro ? -70 : 0);
    const entries = await db.select().from(financialEntries);
    expect(entries.filter((e) => e.kind === 'REFUND')).toHaveLength(2);
    expect(
      entries
        .filter((e) => e.sourceKey.startsWith('commission-refund:'))
        .reduce((sum, e) => sum + e.amountCents, 0),
    ).toBe(pro ? 0 : 150);
    expect((await reconcileFinancial(db, gateway(booking.bookingId, 1500, 0), payload)).ok).toBe(
      false,
    );
    await db
      .update(organizationAccess)
      .set({ complimentary: true })
      .where(eq(organizationAccess.organizationId, owner.organizationId));
    const csv = required(await owner.financial.export(owner.actor, owner.organizationId));
    expect(csv).toContain('commission_restituee_centimes');
  },
);
