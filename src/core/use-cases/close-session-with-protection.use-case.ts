import { guardUseCase } from '../../lib/guard-use-case';

import type { Result } from '../../lib/result';
import type { AuthorizationPort } from '../ports/authorization.port';
import type {
  SessionClosureRepositoryPort,
  CloseSessionInput,
  CloseSessionOutcome,
} from '../ports/closure.port';
export type { CloseSessionInput, CloseSessionOutcome } from '../ports/closure.port';
export class CloseSessionWithProtectionUseCase {
  constructor(
    private readonly deps: {
      readonly closureRepo: SessionClosureRepositoryPort;
      readonly authorization: AuthorizationPort;
    },
  ) {}
  async execute(input: CloseSessionInput): Promise<Result<CloseSessionOutcome>> {
    return guardUseCase('close-session-with-protection.use-case.ts', 'execute', async () => {
      const auth = await this.deps.authorization.authorizeOrganizationAdmin(input.organizationId);
      return auth.ok ? this.deps.closureRepo.closeSessionAtomically(input) : auth;
    });
  }
}
