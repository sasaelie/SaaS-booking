import type { PortalIdentityPort } from '../ports/portal-identity.port';
import type { ParticipantRecoveryPort } from '../ports/participant-recovery.port';
import { ParticipantRecoverySchema } from '../validation/participant';
import { withPortalActor } from './portal/actor';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
export class ParticipantRecoveryUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: ParticipantRecoveryPort,
  ) {}
  execute(raw: unknown) {
    return withPortalActor(this.identity, 'ParticipantRecovery', async (actor) => {
      const input = ParticipantRecoverySchema.safeParse(raw);
      return input.success
        ? this.repository.recover(actor, input.data.organizationId, input.data.bookingId)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'ParticipantRecovery', 'input');
    });
  }
}
