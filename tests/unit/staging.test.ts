import { expect, it, vi } from 'vitest';
import { EnvironmentSchema } from '../../src/config/env';
import { paymentsEnabled } from '../../src/config/staging';
import { providers } from '../../src/composition/providers';

vi.mock('stripe', () => ({
  default: function DisabledStripe() {
    throw Error('Stripe SDK must not initialize in disabled mode');
  },
}));

const configuration = {
  DATABASE_URL: 'postgresql://app:local@127.0.0.1/booking_test',
  NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  SELF_CANCEL_HMAC_SECRET: 'test_only_secret_not_for_production_123456',
};

it('refuses a staging configuration that could enable payments', () => {
  expect(
    EnvironmentSchema.safeParse({ ...configuration, APP_ENVIRONMENT: 'staging' }).success,
  ).toBe(false);
  expect(
    EnvironmentSchema.safeParse({
      ...configuration,
      APP_ENVIRONMENT: 'staging',
      PAYMENTS_ENABLED: 'true',
    }).success,
  ).toBe(false);
});

it('allows staging only with payments explicitly disabled', () => {
  const parsed = EnvironmentSchema.safeParse({
    ...configuration,
    APP_ENVIRONMENT: 'staging',
    PAYMENTS_ENABLED: 'false',
  });
  expect(parsed.success).toBe(true);
  if (parsed.success) expect(paymentsEnabled(parsed.data)).toBe(false);
  expect(paymentsEnabled({})).toBe(true);
});

it('does not initialize Stripe or refund money even if credentials are accidentally present', async () => {
  const services = providers({
    ...configuration,
    APP_ENVIRONMENT: 'staging',
    PAYMENTS_ENABLED: 'false',
    STRIPE_SECRET_KEY: 'sk_live_not_a_real_key',
    STRIPE_WEBHOOK_SECRET: 'whsec_not_a_real_secret',
  });
  const result = await services.gateway.refundPayment({
    paymentReference: 'pi_test',
    reason: 'test',
    amountCents: 100,
    idempotencyKey: 'staging-refund-test',
    merchantAccountId: null,
  });
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.error.code).toBe('CONFIGURATION_ERROR');
});
