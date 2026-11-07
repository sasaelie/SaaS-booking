import { guardUseCase } from '../../lib/guard-use-case';
import { PAYMENT_RULES } from '../../config/constants';

import { ok, type Result } from '../../lib/result';
import { verifySelfCancelToken } from '../domain/self-service-token';
import { validateBankProofBinary } from '../domain/proof-validator';
import type {
  PrivateProofStoragePort,
  ProofImagePort,
  BankTransferRepositoryPort,
} from '../ports/bank.port';
import type { AuthorizationPort } from '../ports/authorization.port';
export interface BankTransferWorkflowDeps {
  readonly storagePort: PrivateProofStoragePort;
  readonly imagePort: ProofImagePort;
  readonly bankRepo: BankTransferRepositoryPort;
  readonly authorization: AuthorizationPort;
  readonly secret: string;
  readonly nowProvider?: () => Date;
}
export class BankTransferWorkflowUseCase {
  constructor(private readonly deps: BankTransferWorkflowDeps) {}
  async submitProof(input: {
    readonly token: string;
    readonly fileBytes: Uint8Array;
  }): Promise<Result<{ readonly status: 'PROOF_SUBMITTED' }>> {
    return guardUseCase('bank-transfer-workflow.use-case.ts', 'submitProof', async () => {
      const now = this.deps.nowProvider?.() ?? new Date();
      const token = await verifySelfCancelToken(input.token, this.deps.secret, now);
      if (!token.ok) return token;
      const header = validateBankProofBinary(input.fileBytes);
      if (!header.ok) return header;
      const image = await this.deps.imagePort.sanitize(input.fileBytes);
      if (!image.ok) return image;
      const storageKey = `${token.value.organizationId}/${token.value.bookingId}/${crypto.randomUUID()}.png`;
      const cleanup = await this.deps.bankRepo.scheduleUploadCleanup({
        ...token.value,
        storageKey,
        now,
      });
      if (!cleanup.ok) return cleanup;
      const uploaded = await this.deps.storagePort.uploadPrivateProof({
        storageKey,
        bytes: image.value,
        contentType: 'image/png',
      });
      if (!uploaded.ok) return uploaded;
      const attached = await this.deps.bankRepo.attachProofToBookingAtomically({
        ...token.value,
        proofStorageKey: storageKey,
        now,
      });
      if (!attached.ok) {
        await this.deps.storagePort.deleteProofImmediately(storageKey);
        return attached;
      }
      return ok({ status: 'PROOF_SUBMITTED' });
    });
  }
  async reviewByAdmin(input: {
    readonly organizationId: string;
    readonly bookingId: string;
    readonly decision: 'APPROVE' | 'REJECT';
  }): Promise<Result<void>> {
    return guardUseCase('bank-transfer-workflow.use-case.ts', 'reviewByAdmin', async () => {
      const auth = await this.deps.authorization.authorizeOrganizationAdmin(input.organizationId);
      if (!auth.ok) return auth;
      const result = await this.deps.bankRepo.finalizeAdminBankDecisionAtomically({
        ...input,
        now: this.deps.nowProvider?.() ?? new Date(),
      });
      if (!result.ok) return result;
      const key = result.value.proofStorageKey;
      if (key) {
        const purged = await this.deps.storagePort.deleteProofImmediately(key);
        if (purged.ok)
          await this.deps.bankRepo.acknowledgeProofDeletion(
            input.organizationId,
            input.bookingId,
            key,
          );
      }
      return ok(undefined);
    });
  }
  async viewProof(input: {
    readonly organizationId: string;
    readonly bookingId: string;
  }): Promise<Result<{ readonly presignedUrl: string }>> {
    return guardUseCase('bank-transfer-workflow.use-case.ts', 'viewProof', async () => {
      const auth = await this.deps.authorization.authorizeOrganizationAdmin(input.organizationId);
      if (!auth.ok) return auth;
      const proof = await this.deps.bankRepo.getProofForAdmin(
        input.organizationId,
        input.bookingId,
      );
      if (!proof.ok) return proof;
      return this.deps.storagePort.getTemporaryAdminViewUrl({
        storageKey: proof.value.storageKey,
        expiresInSeconds: PAYMENT_RULES.PRESIGNED_URL_EXPIRY_SECONDS,
      });
    });
  }
}
