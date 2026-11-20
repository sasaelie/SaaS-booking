import type { ApplicationAuth } from './application-auth';
import type { PasswordProofPort } from '../../core/ports/administrator-security';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
export class PasswordProofAdapter implements PasswordProofPort {
  constructor(
    private readonly auth: ApplicationAuth,
    private readonly headers: Headers,
  ) {}
  async verify(password: string) {
    try {
      const result = await this.auth.api.verifyPassword({
        headers: this.headers,
        body: { password },
      });
      return result.status
        ? ok(undefined)
        : failure(ERROR_CODES.UNAUTHORIZED, 'AdministratorSecurity', 'password');
    } catch {
      return failure(ERROR_CODES.UNAUTHORIZED, 'AdministratorSecurity', 'password');
    }
  }
}
