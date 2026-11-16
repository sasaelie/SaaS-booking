import type { Result } from '../../lib/result';
import type { SimulationParticipantTarget } from '../validation/simulation-participant';
export interface SimulationParticipantLoginPort {
  resolve(code: string, now: Date): Promise<Result<SimulationParticipantTarget>>;
}
