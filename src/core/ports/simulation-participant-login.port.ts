import type { PortalActor } from './portal-models';
import type { Result } from '../../lib/result';
import type { SimulationParticipantTarget } from '../validation/simulation-participant';
export interface SimulationParticipantLoginPort {
  resolve(
    actor: PortalActor,
    code: string,
    now: Date,
  ): Promise<Result<SimulationParticipantTarget>>;
}
