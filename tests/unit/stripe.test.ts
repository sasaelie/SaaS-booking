import { expect, it, vi } from 'vitest';
import Stripe from 'stripe';
import { StripePaymentAdapter } from '../../src/adapters/payments/stripe-payment.adapter';
import { ERROR_CODES } from '../../src/config/constants';
const secret = 'whsec_unit_test';
const stripe = new Stripe('sk_test_fixture');
const now = new Date('2026-11-09T10:00:00Z');
const adapter = new StripePaymentAdapter(stripe, secret, () => now);
const bookingId = '22222222-2222-4222-8222-222222222222';
const organizationId = '11111111-1111-4111-8111-111111111111';
function signed(payment_status = 'paid', currency = 'eur') {
  const payload = JSON.stringify({
    id: 'evt_test',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test',
        payment_intent: 'pi_test',
        payment_status,
        currency,
        amount_total: 3000,
        metadata: { booking_id: bookingId, organization_id: organizationId },
      },
    },
  });
  return { payload, signature: stripe.webhooks.generateTestHeaderString({ payload, secret }) };
}
it('verifies a real Stripe HMAC and preserves financial identity', async () => {
  const input = signed();
  const result = await adapter.verifyWebhookAndParse(input.payload, input.signature);
  expect(result.ok && result.value?.currency).toBe('EUR');
  expect(result.ok && result.value?.organizationId).toBe(organizationId);
});
it('rejects an invalid signature and ignores completed unpaid sessions', async () => {
  const input = signed('unpaid');
  expect(await adapter.verifyWebhookAndParse(input.payload, input.signature)).toEqual({
    ok: true,
    value: null,
  });
  const forged = await adapter.verifyWebhookAndParse(input.payload, 'invalid');
  expect(forged.ok).toBe(false);
  if (!forged.ok) expect(forged.error.code).toBe(ERROR_CODES.UNAUTHORIZED);
});
it('rejects unsupported currency', async () => {
  const input = signed('paid', 'usd');
  expect((await adapter.verifyWebhookAndParse(input.payload, input.signature)).ok).toBe(false);
});
it('uses stable Checkout idempotency, email and server-calculated expiration', async () => {
  const create = vi.spyOn(stripe.checkout.sessions, 'create').mockResolvedValue({
    id: 'cs_test',
    url: 'https://checkout.stripe.com/test',
    expires_at: Math.ceil(now.getTime() / 1000) + 1801,
  } as Stripe.Response<Stripe.Checkout.Session>);
  const result = await adapter.initiatePayment({
    organizationId,
    bookingId,
    activityName: 'Activity',
    amountCents: 3000,
    currency: 'EUR',
    customerEmail: 'test@example.com',
    expiresAt: new Date(now.getTime() + 1800000),
    successUrl: 'https://example.com/success',
    cancelUrl: 'https://example.com/cancel',
    merchantAccountId: null,
  });
  expect(result.ok).toBe(true);
  expect(create).toHaveBeenCalledWith(
    expect.objectContaining({
      customer_email: 'test@example.com',
      expires_at: Math.ceil(now.getTime() / 1000) + 1801,
    }),
    expect.objectContaining({ idempotencyKey: `checkout:${bookingId}` }),
  );
  create.mockRestore();
});
