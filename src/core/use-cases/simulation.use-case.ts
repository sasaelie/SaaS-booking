import type { SimulationRepositoryPort } from '../ports/simulation.port';
import { SimulationPaymentSchema, SimulationDeleteSchema } from '../validation/simulation';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { guardUseCase } from '../../lib/guard-use-case';
export class SimulationUseCase {
  constructor(private readonly repository: SimulationRepositoryPort) {}
  count() {
    return guardUseCase('Simulation', 'count', () => this.repository.count());
  }
  list() {
    return guardUseCase('Simulation', 'list', () => this.repository.list());
  }
  payment(raw: unknown) {
    return guardUseCase('Simulation', 'payment', async () => {
      const input = SimulationPaymentSchema.safeParse(raw);
      return input.success
        ? this.repository.payment(input.data.bookingId, input.data.success)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Simulation', 'payment');
    });
  }
  delete(raw: unknown) {
    return guardUseCase('Simulation', 'delete', async () => {
      const input = SimulationDeleteSchema.safeParse(raw);
      return input.success
        ? this.repository.delete(input.data.bookingId)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Simulation', 'delete');
    });
  }
}
