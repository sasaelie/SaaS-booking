import type { Result } from '../../lib/result';
import type { AllowedProofMimeType } from '../domain/proof-validator';
export interface PrivateProofStoragePort {
  uploadPrivateProof(input: {
    readonly storageKey: string;
    readonly bytes: Uint8Array;
    readonly contentType: AllowedProofMimeType;
  }): Promise<Result<{ readonly storageKey: string }>>;
  getTemporaryAdminViewUrl(input: {
    readonly storageKey: string;
    readonly expiresInSeconds: number;
  }): Promise<Result<{ readonly presignedUrl: string }>>;
  deleteProofImmediately(storageKey: string): Promise<Result<{ readonly deleted: true }>>;
}
export interface ProofImagePort {
  sanitize(bytes: Uint8Array): Promise<Result<Uint8Array>>;
}
export interface BankTransferRepositoryPort {
  acknowledgeProofDeletion(
    organizationId: string,
    bookingId: string,
    storageKey: string,
  ): Promise<Result<void>>;
  scheduleUploadCleanup(input: {
    readonly organizationId: string;
    readonly bookingId: string;
    readonly version: number;
    readonly storageKey: string;
    readonly now: Date;
  }): Promise<Result<void>>;
  attachProofToBookingAtomically(input: {
    readonly organizationId: string;
    readonly bookingId: string;
    readonly version: number;
    readonly proofStorageKey: string;
    readonly now: Date;
  }): Promise<Result<void>>;
  finalizeAdminBankDecisionAtomically(input: {
    readonly organizationId: string;
    readonly bookingId: string;
    readonly decision: 'APPROVE' | 'REJECT';
    readonly now: Date;
  }): Promise<Result<{ readonly proofStorageKey: string | null }>>;
  getProofForAdmin(
    organizationId: string,
    bookingId: string,
  ): Promise<Result<{ readonly storageKey: string }>>;
}
