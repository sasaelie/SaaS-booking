import type { ApplicationAuth } from './application-auth';
import type { PortalIdentityPort } from '../../core/ports/portal-identity.port';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
import { ERROR_CODES } from '../../config/constants';
export class SessionIdentityAdapter implements PortalIdentityPort {
  constructor(
    private readonly auth: ApplicationAuth,
    private readonly headers: Headers,
  ) {}
  async current() {
    try {
      const session = await this.auth.api.getSession({
        headers: this.headers,
        query: { disableCookieCache: true },
      });
      if (!session) return failure(ERROR_CODES.UNAUTHORIZED, 'Authentication', 'session');
      if (!session.user.emailVerified)
        return failure(ERROR_CODES.EMAIL_NOT_VERIFIED, 'Authentication', 'verified');
      return ok({ id: session.user.id, name: session.user.name, email: session.user.email });
    } catch {
      return failure(ERROR_CODES.UNAUTHORIZED, 'Authentication', 'session');
    }
  }
}
