import 'server-only';
import type { Runtime } from './runtime';
import type { ApplicationAuth } from '../adapters/auth/application-auth';
import type { SessionIdentityAdapter } from '../adapters/auth/session-identity.adapter';
import { DrizzleAdministratorSecurityRepository } from '../adapters/db/drizzle-administrator-security.repository';
import { PasswordProofAdapter } from '../adapters/auth/password-proof.adapter';
import { SimpleWebAuthnAdapter } from '../adapters/auth/simple-webauthn.adapter';
import { DrizzleRateLimit } from '../adapters/db/drizzle-rate-limit';
import { AdministratorSecurityUseCase } from '../core/use-cases/portal/administrator-security.use-case';
import { ADMIN_SECURITY as C } from '../config/administrator-security';
import { ADMIN_CODES, isLocalAdministratorMailTest } from '../config/administrator-codes';
import { DrizzleAdministratorCodesRepository } from '../adapters/db/drizzle-administrator-codes.repository';
import { AdministratorOtpAdapter } from '../adapters/auth/administrator-otp.adapter';
import { AdministratorCodeMailAdapter } from '../adapters/auth/administrator-code-mail.adapter';
import { LocalAdministratorCodeMailAdapter } from '../adapters/auth/local-administrator-code-mail.adapter';
export function administratorSecurity(
  app: Runtime,
  auth: ApplicationAuth,
  identity: SessionIdentityAdapter,
  headers: Headers,
) {
  return new AdministratorSecurityUseCase(
    identity,
    new DrizzleAdministratorSecurityRepository(
      app.db,
      new SimpleWebAuthnAdapter(app.env.NEXT_PUBLIC_APP_URL),
      new DrizzleAdministratorCodesRepository(
        app.db,
        new AdministratorOtpAdapter(app.env.BETTER_AUTH_SECRET ?? ''),
        isLocalAdministratorMailTest({ ...process.env, ...app.env })
          ? new LocalAdministratorCodeMailAdapter(app.db)
          : new AdministratorCodeMailAdapter(app.services.resend, app.env.MAIL_FROM),
      ),
    ),
    new PasswordProofAdapter(auth, headers),
    new DrizzleRateLimit(app.db, { max: C.RATE_MAX, windowSeconds: C.RATE_SECONDS }),
    new DrizzleRateLimit(app.db, {
      max: ADMIN_CODES.EMAIL_MAX_SENDS,
      windowSeconds: ADMIN_CODES.EMAIL_WINDOW_SECONDS,
    }),
  );
}
