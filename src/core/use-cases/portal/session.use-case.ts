import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import { withPortalActor } from './actor';
import { ok } from '../../../lib/result';
export class PortalSessionUseCase {
  constructor(private readonly identity: PortalIdentityPort) {}
  execute() {
    return withPortalActor(this.identity, 'PortalSession', async (actor) => ok(actor));
  }
}
