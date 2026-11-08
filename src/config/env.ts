import { z } from 'zod';
import { INPUT_LIMITS, ERROR_CODES } from './constants';
import { failure } from '../lib/errors';
import { ok, type Result } from '../lib/result';
import { DatabaseSchema, supportsSessionLocks } from './database';
import { STAGING } from './staging';
const optionalSecret = z.string().min(INPUT_LIMITS.SECRET_MIN).optional();
export const EnvironmentSchema = z
  .object({
    APP_ENVIRONMENT: z.enum(['production', 'staging']).optional(),
    PAYMENTS_ENABLED: z.enum(['true', 'false']).optional(),
    DATABASE_URL: z
      .url()
      .refine((value) => value.startsWith('postgres') && supportsSessionLocks(value)),
    DATABASE_SCHEMA: DatabaseSchema.optional(),
    DATABASE_SSL_CA: z.string().includes('-----BEGIN CERTIFICATE-----').optional(),
    NEXT_PUBLIC_APP_URL: z.url(),
    SELF_CANCEL_HMAC_SECRET: z.string().min(INPUT_LIMITS.SECRET_MIN),
    STRIPE_SECRET_KEY: z.string().startsWith('sk_').optional(),
    STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
    RESEND_API_KEY: z.string().optional(),
    MAIL_FROM: z.email().optional(),
    CRON_SECRET: optionalSecret,
    BETTER_AUTH_SECRET: optionalSecret,
    STRIPE_CONNECT_CLIENT_ID: z.string().startsWith('ca_').optional(),
    STRIPE_CONNECT_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
    STRIPE_SAAS_PRICE_ID: z.string().startsWith('price_').optional(),
    STRIPE_SAAS_WEBHOOK_SECRET: z.string().startsWith('whsec_').optional(),
    AUTH_ISSUER: z.url().optional(),
    AUTH_AUDIENCE: z.string().optional(),
    AUTH_JWKS_URL: z.url().optional(),
    STORAGE_ENDPOINT: z.url().optional(),
    STORAGE_BACKEND: z.enum(['s3', 'postgres']).optional(),
    STORAGE_REGION: z.string().optional(),
    STORAGE_BUCKET: z.string().optional(),
    STORAGE_ACCESS_KEY_ID: z.string().optional(),
    STORAGE_SECRET_ACCESS_KEY: z.string().optional(),
  })
  .superRefine((environment, context) => {
    if (environment.STORAGE_BACKEND === 'postgres' && environment.APP_ENVIRONMENT !== STAGING.MODE)
      context.addIssue({
        code: 'custom',
        path: ['STORAGE_BACKEND'],
        message: 'Database file storage is restricted to staging',
      });
    if (
      environment.APP_ENVIRONMENT === STAGING.MODE &&
      environment.PAYMENTS_ENABLED !== STAGING.DISABLED
    )
      context.addIssue({
        code: 'custom',
        path: ['PAYMENTS_ENABLED'],
        message: 'Staging requires payments disabled',
      });
  });
export type Environment = z.infer<typeof EnvironmentSchema>;
export function readEnvironment(input: unknown = process.env): Result<Environment> {
  const parsed = EnvironmentSchema.safeParse(input);
  return parsed.success
    ? ok(parsed.data)
    : failure(ERROR_CODES.CONFIGURATION_ERROR, 'Environment', 'readEnvironment');
}
