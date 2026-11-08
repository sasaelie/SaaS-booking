import type { Result } from '../../../lib/result';
import { guardUseCase } from '../../../lib/guard-use-case';
import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { PortalActor } from '../../ports/portal-models';
export function withPortalActor<T>(
  identity: PortalIdentityPort,
  module: string,
  action: (actor: PortalActor) => Promise<Result<T>>,
): Promise<Result<T>> {
  return guardUseCase(module, 'execute', async () => {
    const actor = await identity.current();
    return actor.ok ? action(actor.value) : actor;
  });
}
