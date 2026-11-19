import type { RefinementCtx } from 'zod';
import { PUBLIC_TEST } from './public-test';
import { STAGING } from './staging';
export const PUBLIC_TEST_FORBIDDEN_ENV = [
  'RESEND_API_KEY',
  'MAIL_FROM',
  'BETTER_AUTH_SECRET',
  'CRON_SECRET',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'STRIPE_CONNECT_WEBHOOK_SECRET',
  'STRIPE_SAAS_WEBHOOK_SECRET',
  'AUTH_ISSUER',
  'AUTH_JWKS_URL',
  'STORAGE_ACCESS_KEY_ID',
  'STORAGE_SECRET_ACCESS_KEY',
] as const;
export function validatePublicTestEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
  context: RefinementCtx,
) {
  if (environment['PUBLIC_TEST_MODE'] !== 'true') return;
  if (
    environment['APP_ENVIRONMENT'] !== STAGING.MODE ||
    environment['PAYMENTS_ENABLED'] !== STAGING.DISABLED ||
    environment['DATABASE_SCHEMA'] !== PUBLIC_TEST.SCHEMA ||
    !environment['PUBLIC_TEST_ORGANIZATION_ID'] ||
    !environment['PUBLIC_TEST_ORGANIZATION_SLUG'] ||
    environment['OPERATIONAL_PURGE_ENABLED'] === 'true' ||
    PUBLIC_TEST_FORBIDDEN_ENV.some((key) => Boolean(environment[key]))
  )
    context.addIssue({
      code: 'custom',
      path: ['PUBLIC_TEST_MODE'],
      message:
        'Public test requires isolated staging without external credentials or organizer authentication',
    });
}
