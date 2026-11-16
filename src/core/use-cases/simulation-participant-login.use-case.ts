import type { SimulationParticipantLoginPort } from '../ports/simulation-participant-login.port';
import { SimulationParticipantExchangeSchema } from '../validation/simulation-participant';
import { guardUseCase } from '../../lib/guard-use-case';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
export class SimulationParticipantLoginUseCase {
  constructor(private readonly repository: SimulationParticipantLoginPort) {}
  execute(raw: unknown) {
    return guardUseCase('SimulationLogin', 'exchange', async () => {
      const input = SimulationParticipantExchangeSchema.safeParse(raw);
      return input.success
        ? this.repository.resolve(input.data.code, new Date())
        : failure(ERROR_CODES.UNAUTHORIZED, 'SimulationLogin', 'input');
    });
  }
}
