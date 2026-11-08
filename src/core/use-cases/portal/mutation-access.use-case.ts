import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { RateLimitPort } from '../../ports/rate-limit.port';
import { withPortalActor } from './actor';
export class PortalMutationAccessUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly limiter: RateLimitPort,
  ) {}
  execute() {
    return withPortalActor(this.identity, 'PortalMutation', (actor) =>
      this.limiter.accept(`portal-mutation:${actor.id}`),
    );
  }
}
