import { expect, it, vi } from 'vitest';
import Stripe from 'stripe';
import { StripePaymentAdapter } from '../../src/adapters/payments/stripe-payment.adapter';
const stripe = new Stripe('sk_test_local');
const adapter = new StripePaymentAdapter(stripe, 'whsec_local');
const input = {
  organizationId: '11111111-1111-4111-8111-111111111111',
  bookingId: '22222222-2222-4222-8222-222222222222',
  activityName: 'Test',
  amountCents: 3000,
  currency: 'EUR',
  customerEmail: 'test@example.com',
  expiresAt: new Date(Date.now() + 1800000),
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel',
  merchantAccountId: 'acct_test',
};
it('keeps the public amount and charges the platform fee only once on a Liberty destination charge', async () => {
  const create = vi.spyOn(stripe.checkout.sessions, 'create').mockResolvedValue({
    id: 'cs_local',
    url: 'https://checkout.stripe.com/local',
    expires_at: Date.now() / 1000,
  } as Stripe.Response<Stripe.Checkout.Session>);
  expect(
    (await adapter.initiatePayment({ ...input, chargeModel: 'DESTINATION', commissionCents: 150 }))
      .ok,
  ).toBe(true);
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({
      payment_method_types: ['card', 'bancontact'],
      payment_intent_data: expect.objectContaining({
        application_fee_amount: 150,
        transfer_data: { destination: 'acct_test' },
      }),
      line_items: [
        expect.objectContaining({ price_data: expect.objectContaining({ unit_amount: 3000 }) }),
      ],
    }),
    expect.not.objectContaining({ stripeAccount: 'acct_test' }),
  );
  create.mockRestore();
});
it('uses direct Pro charges with zero platform commission', async () => {
  const create = vi.spyOn(stripe.checkout.sessions, 'create').mockResolvedValue({
    id: 'cs_local',
    url: 'https://checkout.stripe.com/local',
    expires_at: Date.now() / 1000,
  } as Stripe.Response<Stripe.Checkout.Session>);
  await adapter.initiatePayment({ ...input, chargeModel: 'DIRECT', commissionCents: 0 });
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({
      payment_intent_data: expect.not.objectContaining({
        application_fee_amount: expect.anything(),
      }),
    }),
    expect.objectContaining({ stripeAccount: 'acct_test' }),
  );
  create.mockRestore();
});
it('keeps absent bank fees pending and reads actual expanded balance fees', async () => {
  const intent = {
    id: 'pi_local',
    status: 'succeeded',
    metadata: { organization_id: input.organizationId, booking_id: input.bookingId },
    latest_charge: null,
    transfer_data: { destination: 'acct_test' },
  };
  const retrieve = vi
    .spyOn(stripe.paymentIntents, 'retrieve')
    .mockResolvedValue(intent as unknown as Stripe.Response<Stripe.PaymentIntent>);
  const request = { ...input, paymentReference: 'pi_local', chargeModel: 'DESTINATION' as const };
  expect(await adapter.reconcilePayment(request)).toEqual({ ok: true, value: null });
  retrieve.mockResolvedValue({
    ...intent,
    latest_charge: {
      id: 'ch_local',
      amount: 3000,
      amount_refunded: 0,
      balance_transaction: { id: 'txn_local', currency: 'eur', fee: 70 },
      application_fee: { amount: 150, amount_refunded: 0 },
      transfer: { id: 'tr_local', amount: 3000, amount_reversed: 0 },
    },
  } as unknown as Stripe.Response<Stripe.PaymentIntent>);
  expect(await adapter.reconcilePayment(request)).toMatchObject({
    value: { stripeFeeCents: 70, amountCents: 3000, transferredCents: 2850 },
  });
  retrieve.mockRestore();
});
it('rejects a balance from a different organization', async () => {
  const retrieve = vi.spyOn(stripe.paymentIntents, 'retrieve').mockResolvedValue({
    metadata: { organization_id: 'foreign', booking_id: input.bookingId },
  } as unknown as Stripe.Response<Stripe.PaymentIntent>);
  expect(
    (
      await adapter.reconcilePayment({
        ...input,
        paymentReference: 'pi_local',
        chargeModel: 'DIRECT',
      })
    ).ok,
  ).toBe(false);
  retrieve.mockRestore();
});
it('refunds Liberty with transfer reversal and the application fee, on the platform account', async () => {
  const refund = vi
    .spyOn(stripe.refunds, 'create')
    .mockResolvedValue({
      id: 're_local',
      status: 'succeeded',
      amount: 3000,
      payment_intent: 'pi_local',
    } as Stripe.Response<Stripe.Refund>);
  await adapter.refundPayment({
    paymentReference: 'pi_local',
    amountCents: 3000,
    reason: 'Test',
    idempotencyKey: 'refund:test',
    merchantAccountId: 'acct_test',
    chargeModel: 'DESTINATION',
  });
  expect(refund).toHaveBeenCalledWith(
    expect.objectContaining({ reverse_transfer: true, refund_application_fee: true }),
    { idempotencyKey: 'refund:test' },
  );
  refund.mockRestore();
});
