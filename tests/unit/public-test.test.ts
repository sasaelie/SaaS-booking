import { expect, it } from 'vitest';
import { EnvironmentSchema } from '../../src/config/env';
import { PUBLIC_TEST, publicTestPath } from '../../src/config/public-test';
import { bookingPublication } from '../../src/config/booking-publication';
import { publicTestBooking } from '../../src/core/validation/public-test';
const organizationId = '9006c789-25a0-4455-8adb-0e8d17ba192b';
const settings = {
  PUBLIC_TEST_ORGANIZATION_ID: organizationId,
  PUBLIC_TEST_ORGANIZATION_SLUG: 'studio-test',
};
const env = {
  ...settings,
  PUBLIC_TEST_MODE: 'true',
  APP_ENVIRONMENT: 'staging',
  PAYMENTS_ENABLED: 'false',
  DATABASE_SCHEMA: PUBLIC_TEST.SCHEMA,
  DATABASE_URL: 'postgresql://demo:secret@localhost/test',
  NEXT_PUBLIC_APP_URL: 'https://demo.example.com',
  SELF_CANCEL_HMAC_SECRET: 'a'.repeat(32),
};
it('allows only the selected catalog and participant capabilities', () => {
  for (const path of [
    '/studio-test',
    '/embed/studio-test',
    '/studio-test/7d46bb31-ef6b-4a59-89c8-f8163691d234',
    '/widget.js',
    '/manage',
    '/api/participant/exchange',
    '/api/participant/test/context',
    '/api/self-service/context',
  ])
    expect(publicTestPath(path, settings)).toBe(true);
  for (const path of [
    '/app',
    '/plateforme',
    '/apercu-site',
    '/api/auth/sign-up/email',
    '/api/jobs',
    '/api/portal/activities',
    '/api/simulation/x',
    '/another-org',
    '/embed/another-org',
    '/api/participant/recover',
    '/embed/studio-test/%2e%2e/app',
    '/api/self-service/../auth',
  ])
    expect(publicTestPath(path, settings)).toBe(false);
  expect(publicTestPath('/widget.js', {})).toBe(false);
});
it('fails closed if private credentials or a private database schema are supplied', () => {
  expect(EnvironmentSchema.safeParse(env).success).toBe(true);
  for (const override of [
    { DATABASE_SCHEMA: 'booking' },
    { PAYMENTS_ENABLED: 'true' },
    { APP_ENVIRONMENT: 'production' },
    { RESEND_API_KEY: 're_private' },
    { BETTER_AUTH_SECRET: 'b'.repeat(32) },
    { STRIPE_SECRET_KEY: 'sk_test_private' },
    { PUBLIC_TEST_ORGANIZATION_ID: undefined },
  ])
    expect(EnvironmentSchema.safeParse({ ...env, ...override }).success).toBe(false);
});
it('replaces personal coordinates and rejects other tenants before writing', () => {
  const raw = {
    organizationId,
    activityId: '7d46bb31-ef6b-4a59-89c8-f8163691d234',
    startsAtIso: '2026-12-01T10:00:00.000Z',
    idempotencyKey: 'public-demo-key',
    firstName: 'Private',
    lastName: 'Person',
    email: 'real@example.com',
    phone: '+32470000000',
    marketingOptIn: true,
    acceptedTerms: true,
    acceptedAgeAttestation: true,
    acceptedTermsVersionHash: 'a'.repeat(64),
  };
  expect(publicTestBooking(raw, organizationId)).toMatchObject({
    firstName: PUBLIC_TEST.FIRST_NAME,
    email: PUBLIC_TEST.EMAIL,
    marketingOptIn: false,
  });
  expect(publicTestBooking(raw, '7d46bb31-ef6b-4a59-89c8-f8163691d234')).toBeNull();
  expect(publicTestBooking({ ...raw, acceptedTerms: 'yes' }, organizationId)).toBeNull();
});
it('publishes links only for the explicitly selected organization', () => {
  const config = {
    NEXT_PUBLIC_APP_URL: 'https://private.example.com',
    PUBLIC_BOOKING_URL: 'https://test.example.com',
    PUBLIC_BOOKING_ORGANIZATION_ID: organizationId,
  };
  expect(bookingPublication(organizationId, config)).toEqual({
    appUrl: config.PUBLIC_BOOKING_URL,
    published: true,
  });
  expect(bookingPublication('another', config)).toEqual({
    appUrl: config.NEXT_PUBLIC_APP_URL,
    published: false,
  });
});
it('accepts only an HTTPS origin without credentials, fragments or script attributes for publication', () => {
  const base = { ...env, PUBLIC_BOOKING_ORGANIZATION_ID: organizationId };
  expect(
    EnvironmentSchema.safeParse({ ...base, PUBLIC_BOOKING_URL: 'https://demo.example.com' })
      .success,
  ).toBe(true);
  for (const PUBLIC_BOOKING_URL of [
    'http://demo.example.com',
    'https://user:password@demo.example.com',
    'https://demo.example.com/path',
    'https://demo.example.com/#secret',
    'https://demo.example.com/?x=1',
  ])
    expect(EnvironmentSchema.safeParse({ ...base, PUBLIC_BOOKING_URL }).success).toBe(false);
  expect(EnvironmentSchema.safeParse({ ...base, PUBLIC_BOOKING_URL: undefined }).success).toBe(
    false,
  );
});
