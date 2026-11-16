import type { ReadSelfBookingUseCase } from './read-self-booking.use-case';
import type { VoucherLifecycleUseCase } from './voucher-lifecycle.use-case';
import {
  SimulationParticipantOperationSchema,
  SimulationParticipantRequestSchema,
} from '../validation/simulation-participant';
import { guardUseCase } from '../../lib/guard-use-case';
import { failure } from '../../lib/errors';
import { ERROR_CODES } from '../../config/constants';
export class SimulationParticipantUseCase {
  constructor(
    private readonly booking: Pick<ReadSelfBookingUseCase, 'execute'>,
    private readonly cancellation: Pick<VoucherLifecycleUseCase, 'cancelByAttendee'>,
  ) {}
  execute(operation: unknown, raw: unknown) {
    return guardUseCase('SimulationParticipant', 'execute', async () => {
      const action = SimulationParticipantOperationSchema.safeParse(operation);
      const input = SimulationParticipantRequestSchema.safeParse(raw);
      if (!action.success || !input.success)
        return failure(ERROR_CODES.VALIDATION_FAILED, 'SimulationParticipant', 'input');
      // Both dependencies use only simulation storage and the simulation signing key.
      const context = await this.booking.execute(input.data.token);
      if (!context.ok) return context;
      if (!context.value.ticket?.isSimulation)
        return failure(ERROR_CODES.UNAUTHORIZED, 'SimulationParticipant', 'ticket');
      return action.data === 'context' ? context : this.cancellation.cancelByAttendee(input.data);
    });
  }
}
