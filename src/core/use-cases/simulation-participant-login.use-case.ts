import type { PortalIdentityPort } from '../ports/portal-identity.port';
import type { SimulationParticipantLoginPort } from '../ports/simulation-participant-login.port';
import { SimulationParticipantExchangeSchema } from '../validation/simulation-participant';
import { withPortalActor } from './portal/actor';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
export class SimulationParticipantLoginUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: SimulationParticipantLoginPort,
  ) {}
  execute(raw: unknown) {
    return withPortalActor(this.identity, 'SimulationLogin', async (actor) => {
      const input = SimulationParticipantExchangeSchema.safeParse(raw);
      return input.success
        ? this.repository.resolve(actor, input.data.code, new Date())
        : failure(ERROR_CODES.UNAUTHORIZED, 'SimulationLogin', 'input');
    });
  }
}
