import type { Result } from '../../lib/result';
import type { PortalActor } from './portal-models';
export interface PortalIdentityPort {
  current(): Promise<Result<PortalActor>>;
}
