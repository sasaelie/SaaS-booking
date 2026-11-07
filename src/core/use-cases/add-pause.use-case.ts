import { guardUseCase } from '../../lib/guard-use-case';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import type { Result } from '../../lib/result';
import type { AuthorizationPort } from '../ports/authorization.port';
import type { PauseRepositoryPort, AddPauseInput } from '../ports/pause.port';
import type { CloseSessionOutcome } from '../ports/closure.port';
export class AddPauseUseCase {
  constructor(
    private readonly deps: {
      readonly authorization: AuthorizationPort;
      readonly pauseRepo: PauseRepositoryPort;
    },
  ) {}
  async execute(input: AddPauseInput): Promise<Result<CloseSessionOutcome>> {
    return guardUseCase('add-pause.use-case.ts', 'execute', async () => {
      const auth = await this.deps.authorization.authorizeOrganizationAdmin(input.organizationId);
      if (!auth.ok) return auth;
      if (
        !Number.isFinite(input.startsAt.getTime()) ||
        !Number.isFinite(input.endsAt.getTime()) ||
        input.endsAt <= input.startsAt
      )
        return failure(ERROR_CODES.VALIDATION_FAILED, 'Pause', 'execute');
      return this.deps.pauseRepo.addPauseAtomically(input);
    });
  }
}
