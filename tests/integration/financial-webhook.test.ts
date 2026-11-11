import { expect, it, vi } from 'vitest';
import Stripe from 'stripe';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { financialFixture, pay } from './financial-fixtures';
import { StripeFinancialWebhook } from '../../src/adapters/payments/stripe-financial-webhook';
import {
  outboxJobs,
  financialEntries,
  financialPayments,
  bookings,
} from '../../src/adapters/db/schema';
import { required } from '../../src/adapters/db/transaction';
const stripe = new Stripe('sk_test_local');
const secret = 'whsec_financial_local';
function signed(data: unknown) {
  const body = JSON.stringify(data);
  return { body, signature: stripe.webhooks.generateTestHeaderString({ payload: body, secret }) };
}
it('authenticates financial events and deduplicates reconciliation and refund entries', async () => {
  const owner = await financialFixture();
  const booking = await pay(owner);
  const handler = new StripeFinancialWebhook(db, stripe, secret);
  const event = signed({
    id: 'evt_refund',
    type: 'charge.refunded',
    data: {
      object: {
        id: 'ch_local',
        payment_intent: `pi_${booking.bookingId}`,
        amount: 3000,
        amount_refunded: 3000,
        refunds: { data: [{ id: 're_local', amount: 3000, status: 'succeeded' }] },
        metadata: { organization_id: owner.organizationId, booking_id: booking.bookingId },
      },
    },
  });
  expect((await handler.handle(event.body, 'forged')).ok).toBe(false);
  required(await handler.handle(event.body, event.signature));
  required(await handler.handle(event.body, event.signature));
  const entries = await db
    .select()
    .from(financialEntries)
    .where(eq(financialEntries.kind, 'REFUND'));
  expect(entries).toHaveLength(1);
  const jobs = await db
    .select()
    .from(outboxJobs)
    .where(eq(outboxJobs.deduplicationKey, 'stripe-financial:evt_refund'));
  expect(jobs).toHaveLength(1);
  expect((await db.select().from(financialPayments))[0]?.refundedCents).toBe(3000);
});
it('rejects a signed event originating from the wrong connected account', async () => {
  const owner = await financialFixture();
  const booking = await pay(owner);
  const event = signed({
    id: 'evt_wrong_account',
    account: 'acct_other',
    type: 'charge.updated',
    data: {
      object: {
        id: 'ch_other',
        payment_intent: `pi_${booking.bookingId}`,
        amount: 3000,
        metadata: { organization_id: owner.organizationId, booking_id: booking.bookingId },
      },
    },
  });
  expect(
    (await new StripeFinancialWebhook(db, stripe, secret).handle(event.body, event.signature)).ok,
  ).toBe(false);
});

it('uses canonical dispute status when signed lifecycle events arrive out of order', async () => {
  const owner = await financialFixture();
  const booking = await pay(owner);
  const intent = `pi_${booking.bookingId}`;
  const retrieve = vi.spyOn(stripe.disputes, 'retrieve').mockResolvedValue({
    id: 'dp_local',
    payment_intent: intent,
    status: 'lost',
  } as Stripe.Response<Stripe.Dispute>);
  try {
    const handler = new StripeFinancialWebhook(db, stripe, secret);
    const stale = signed({
      id: 'evt_stale',
      type: 'charge.dispute.created',
      data: { object: { id: 'dp_local', payment_intent: intent } },
    });
    required(await handler.handle(stale.body, stale.signature));
    expect((await db.select().from(bookings))[0]?.disputeOpen).toBe(false);
    retrieve.mockResolvedValue({
      id: 'dp_local',
      payment_intent: intent,
      status: 'under_review',
    } as Stripe.Response<Stripe.Dispute>);
    const closed = signed({
      id: 'evt_closed',
      type: 'charge.dispute.closed',
      data: { object: { id: 'dp_local', payment_intent: intent } },
    });
    required(await handler.handle(closed.body, closed.signature));
    expect((await db.select().from(bookings))[0]?.disputeOpen).toBe(true);
  } finally {
    retrieve.mockRestore();
  }
});
