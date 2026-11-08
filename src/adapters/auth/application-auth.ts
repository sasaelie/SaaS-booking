import { betterAuth } from 'better-auth';
import { nextCookies } from 'better-auth/next-js';
import type { Pool } from 'pg';
import type { Environment } from '../../config/env';
import { SAAS } from '../../config/constants';
export type AuthEmailSender = (to: string, url: string, reset: boolean) => Promise<void>;
export function createApplicationAuth(
  pool: Pool,
  env: Environment,
  secret: string,
  sendEmail: AuthEmailSender,
) {
  return betterAuth({
    database: pool,
    secret,
    baseURL: env.NEXT_PUBLIC_APP_URL,
    trustedOrigins: [env.NEXT_PUBLIC_APP_URL],
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      autoSignIn: false,
      revokeSessionsOnPasswordReset: true,
      minPasswordLength: SAAS.AUTH_MIN_PASSWORD,
      maxPasswordLength: SAAS.AUTH_MAX_PASSWORD,
      sendResetPassword: ({ user, url }) => sendEmail(user.email, url, true),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: SAAS.AUTH_TOKEN_SECONDS,
      sendVerificationEmail: ({ user, url }) => sendEmail(user.email, url, false),
    },
    session: { expiresIn: SAAS.AUTH_SESSION_SECONDS, cookieCache: { enabled: false } },
    rateLimit: {
      enabled: true,
      storage: 'database',
      window: SAAS.AUTH_RATE_WINDOW,
      max: SAAS.AUTH_RATE_MAX,
    },
    logger: { disabled: true },
    plugins: [nextCookies()],
  });
}
export type ApplicationAuth = ReturnType<typeof createApplicationAuth>;
