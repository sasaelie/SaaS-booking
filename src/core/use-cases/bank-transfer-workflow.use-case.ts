// src/core/use-cases/bank-transfer-workflow.use-case.ts
import {
  BOOKING_STATUSES,
  DATA_RETENTION,
  PAYMENT_RULES,
} from '../../config/constants';
import { ok, type AppError, type Result } from '../../lib/result';
import { validateBankProofBinary } from '../domain/proof-validator';
import type {
  BankTransferRepositoryPort,
  PrivateProofStoragePort,
} from '../ports/bank-and-closure.port';
export interface SubmitBankProofInput {
  readonly organizationId: string;
  readonly bookingId: string;
  readonly fileBytes: Uint8Array;
}
export interface SubmitBankProofOutput {
  readonly bookingId: string;
  readonly status: typeof BOOKING_STATUSES.PROOF_SUBMITTED;
  readonly storageKey: string;
}
export interface AdminBankDecisionInput {
  readonly organizationId: string;
  readonly bookingId: string;
  readonly decision: 'APPROVE' | 'REJECT';
}
export interface AdminBankDecisionOutput {
  readonly bookingId: string;
  readonly finalStatus:
    | typeof BOOKING_STATUSES.CONFIRMED
    | typeof BOOKING_STATUSES.CANCELLED_BY_ORGANIZER;
  readonly proofImagePurged: boolean;
}
export interface BankTransferWorkflowDeps {
  readonly storagePort: PrivateProofStoragePort;
  readonly bankRepo: BankTransferRepositoryPort;
  readonly nowProvider?: () => Date;
}
export class BankTransferWorkflowUseCase {
  public constructor(private readonly deps: BankTransferWorkflowDeps) {}
  public async submitProof(
    input: SubmitBankProofInput,
  ): Promise<Result<SubmitBankProofOutput, AppError>> {
    const validatedRes = validateBankProofBinary(input.fileBytes);
    if (!validatedRes.ok) return validatedRes;
    const now = this.deps.nowProvider ? this.deps.nowProvider() : new Date();
    const storageKey = `org_${input.organizationId}/booking_${input.bookingId}_${now.getTime()}.${validatedRes.value.safeExtension}`;
    const uploadRes = await this.deps.storagePort.uploadPrivateProof({
      storageKey,
      bytes: input.fileBytes,
      contentType: validatedRes.value.detectedMimeType,
    });
    if (!uploadRes.ok) return uploadRes;
    const newLockExpiresAt = new Date(
      now.getTime() + PAYMENT_RULES.BANK_TRANSFER_HOLD_HOURS * 3_600_000,
    );
    const attachRes = await this.deps.bankRepo.attachProofToBookingAtomically({
      organizationId: input.organizationId,
      bookingId: input.bookingId,
      proofStorageKey: storageKey,
      newLockExpiresAt,
    });
    if (!attachRes.ok) return attachRes;
    return ok({
      bookingId: input.bookingId,
      status: BOOKING_STATUSES.PROOF_SUBMITTED,
      storageKey,
    });
  }
  public async reviewByAdmin(
    input: AdminBankDecisionInput,
  ): Promise<Result<AdminBankDecisionOutput, AppError>> {
    const recordRes = await this.deps.bankRepo.getBankTransferBookingForReview(
      input.organizationId,
      input.bookingId,
    );
    if (!recordRes.ok) return recordRes;
    const record = recordRes.value;
    const finalStatus =
      input.decision === 'APPROVE'
        ? BOOKING_STATUSES.CONFIRMED
        : BOOKING_STATUSES.CANCELLED_BY_ORGANIZER;
    const amountPaidCents =
      input.decision === 'APPROVE' ? record.unitPriceCents : 0;
    const shouldPurgeProof =
      (record.autoDeleteBankProof ||
        DATA_RETENTION.AUTO_DELETE_BANK_PROOF_ON_DECISION) &&
      record.proofStorageKey !== null;
    let proofImagePurged = false;
    if (shouldPurgeProof && record.proofStorageKey !== null) {
      const purgeRes = await this.deps.storagePort.deleteProofImmediately(
        record.proofStorageKey,
      );
      if (!purgeRes.ok) return purgeRes;
      proofImagePurged = purgeRes.value.deleted;
    }
    const updateRes =
      await this.deps.bankRepo.finalizeAdminBankDecisionAtomically({
        organizationId: input.organizationId,
        bookingId: input.bookingId,
        nextStatus: finalStatus,
        amountPaidCents,
        clearProofStorageKey: proofImagePurged,
      });
    if (!updateRes.ok) return updateRes;
    return ok({ bookingId: input.bookingId, finalStatus, proofImagePurged });
  }
}
