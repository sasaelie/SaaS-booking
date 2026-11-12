import { afterEach, expect, it, vi } from 'vitest';
import Stripe from 'stripe';
import { StripePaymentAdapter } from '../../src/adapters/payments/stripe-payment.adapter';
const stripe = new Stripe('sk_test_audit_synthetic');
const adapter = new StripePaymentAdapter(stripe, 'whsec_audit_synthetic');
const input = {
  paymentReference: 'pi_audit',
  amountCents: 3000,
  reason: 'Audit',
  idempotencyKey: 'refund:audit',
  merchantAccountId: 'acct_audit',
  chargeModel: 'DIRECT' as const,
};
afterEach(() => vi.restoreAllMocks());
it('blocks a new refund when a previous unknown attempt is older than the provider idempotency window', async () => {
  const create = vi
    .spyOn(stripe.refunds, 'create')
    .mockResolvedValue({
      id: 're_audit',
      status: 'succeeded',
      amount: 3000,
      payment_intent: 'pi_audit',
    } as Stripe.Response<Stripe.Refund>);
  const stale = { ...input, firstAttemptAt: new Date(Date.now() - 25 * 3600000).toISOString() };
  expect((await adapter.refundPayment(stale)).ok).toBe(false);
  expect(create).not.toHaveBeenCalled();
});
it.each(['pending', 'failed', 'succeeded'] as const)(
  'returns the actual %s refund state',
  async (status) => {
    vi.spyOn(stripe.refunds, 'create').mockResolvedValue({
      id: 're_audit',
      status,
      amount: 3000,
      payment_intent: 'pi_audit',
    } as Stripe.Response<Stripe.Refund>);
    expect(await adapter.refundPayment(input)).toMatchObject({
      ok: true,
      value: { refundId: 're_audit', status: status.toUpperCase() },
    });
  },
);
it('resumes a persisted refund by reading it instead of creating another refund', async () => {
  const create = vi
    .spyOn(stripe.refunds, 'create')
    .mockRejectedValue(Error('Unexpected refund creation'));
  const retrieve = vi.spyOn(stripe.refunds, 'retrieve').mockResolvedValue({
    id: 're_audit',
    status: 'succeeded',
    amount: 3000,
    payment_intent: 'pi_audit',
  } as Stripe.Response<Stripe.Refund>);
  const resumed = { ...input, refundId: 're_audit' };
  expect(await adapter.refundPayment(resumed)).toMatchObject({
    ok: true,
    value: { status: 'SUCCEEDED' },
  });
  expect(create).not.toHaveBeenCalled();
  expect(retrieve).toHaveBeenCalledWith('re_audit', {}, { stripeAccount: 'acct_audit' });
});
it.each([
  { amount: 1500, payment_intent: 'pi_audit' },
  { amount: 3000, payment_intent: 'pi_foreign' },
])('rejects a resumed refund with the wrong financial identity: %j', async (values) => {
  const create = vi.spyOn(stripe.refunds, 'create').mockRejectedValue(Error('Unexpected creation'));
  vi.spyOn(stripe.refunds, 'retrieve').mockResolvedValue({
    id: 're_audit',
    status: 'succeeded',
    ...values,
  } as Stripe.Response<Stripe.Refund>);
  expect((await adapter.refundPayment({ ...input, refundId: 're_audit' })).ok).toBe(false);
  expect(create).not.toHaveBeenCalled();
});
