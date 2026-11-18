import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type {
  AdministratorSecurityRepositoryPort,
  PasswordProofPort,
} from '../../ports/administrator-security';
import { AdministratorSecurityCommandSchema } from '../../validation/administrator-security';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { withPortalActor } from './actor';
import type { RateLimitPort } from '../../ports/rate-limit.port';
export class AdministratorSecurityUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: AdministratorSecurityRepositoryPort,
    private readonly password: PasswordProofPort,
    private readonly limiter: RateLimitPort,
  ) {}
  read() {
    return withPortalActor(this.identity, 'AdministratorSecurity', (actor) =>
      this.repository.read(actor),
    );
  }
  mutate(raw: unknown) {
    return withPortalActor(this.identity, 'AdministratorSecurity', async (actor) => {
      const parsed = AdministratorSecurityCommandSchema.safeParse(raw);
      if (!parsed.success)
        return failure(ERROR_CODES.VALIDATION_FAILED, 'AdministratorSecurity', 'input');
      const accepted = await this.limiter.accept(
        `administrator-security:${actor.id}:${parsed.data.action}`,
      );
      if (!accepted.ok) return accepted;
      if ('password' in parsed.data) {
        const proof = await this.password.verify(parsed.data.password);
        if (!proof.ok) return proof;
      }
      return this.repository.mutate(actor, parsed.data);
    });
  }
}
