import type { Result } from '../../lib/result';
import type { PortalActor } from './portal-models';
export interface ParticipantRecoveryPort {
  recover(actor: PortalActor, organizationId: string, bookingId: string): Promise<Result<string>>;
}
