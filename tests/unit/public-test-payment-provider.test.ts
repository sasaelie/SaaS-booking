import { expect, it } from 'vitest';
import { providers } from '../../src/composition/providers';
import { EnvironmentSchema } from '../../src/config/env';
import { SimulationPaymentAdapter } from '../../src/adapters/simulation/payment.adapter';
import { PUBLIC_TEST } from '../../src/config/public-test';
it('selects the existing simulator without external credentials and returns to the booking', async () => {
  const env = EnvironmentSchema.parse({
    PUBLIC_TEST_MODE: 'true',
    APP_ENVIRONMENT: 'staging',
    PAYMENTS_ENABLED: 'false',
    DATABASE_SCHEMA: PUBLIC_TEST.SCHEMA,
    DATABASE_URL: 'postgresql://test@localhost/test',
    PUBLIC_TEST_ORGANIZATION_ID: '9006c789-25a0-4455-8adb-0e8d17ba192b',
    PUBLIC_TEST_ORGANIZATION_SLUG: 'studio-test',
    NEXT_PUBLIC_APP_URL: 'https://test.example.com',
    SELF_CANCEL_HMAC_SECRET: 'a'.repeat(32),
  });
  const { gateway, resend } = providers(env);
  expect(gateway).toBeInstanceOf(SimulationPaymentAdapter);
  expect(resend).toBeNull();
  const result = await gateway.initiatePayment({
    bookingId: 'test-booking',
    organizationId: env.PUBLIC_TEST_ORGANIZATION_ID ?? '',
    activityName: 'Couture',
    amountCents: 2500,
    currency: 'EUR',
    customerEmail: PUBLIC_TEST.EMAIL,
    merchantAccountId: 'acct_simulation',
    expiresAt: new Date('2027-01-01'),
    successUrl: 'https://test.example.com/manage#token=test',
    cancelUrl: 'https://test.example.com/manage',
  });
  expect(result).toMatchObject({
    ok: true,
    value: {
      paymentReference: 'simulation_test-booking',
      checkoutUrl: 'https://test.example.com/manage#token=test',
    },
  });
});
