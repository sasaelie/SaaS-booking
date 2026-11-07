// src/core/ports/bank-and-closure.port.ts
import type { BookingStatus, PaymentMode } from '../../config/constants';
import type { AppError, Result } from '../../lib/result';
import type { AllowedProofMimeType } from '../domain/proof-validator';

export interface PrivateProofStoragePort {
  uploadPrivateProof(params: {
    readonly storageKey: string;
    readonly bytes: Uint8Array;
    readonly contentType: AllowedProofMimeType;
  }): Promise<Result<{ readonly storageKey: string }, AppError>>;
  getTemporaryAdminViewUrl(params: {
    readonly storageKey: string;
    readonly expiresInSeconds: number;
  }): Promise<Result<{ readonly presignedUrl: string }, AppError>>;
  deleteProofImmediately(
    storageKey: string,
  ): Promise<Result<{ readonly deleted: true }, AppError>>;
}
export interface BankTransferBookingRecord {
  readonly bookingId: string;
  readonly organizationId: string;
  readonly status: BookingStatus;
  readonly proofStorageKey: string | null;
  readonly autoDeleteBankProof: boolean;
  readonly unitPriceCents: number;
  readonly attendeeEmail: string;
  readonly attendeeFirstName: string;
}
export interface BankTransferRepositoryPort {
  attachProofToBookingAtomically(params: {
    readonly organizationId: string;
    readonly bookingId: string;
    readonly proofStorageKey: string;
    readonly newLockExpiresAt: Date;
  }): Promise<Result<void, AppError>>;
  getBankTransferBookingForReview(
    organizationId: string,
    bookingId: string,
  ): Promise<Result<BankTransferBookingRecord, AppError>>;
  finalizeAdminBankDecisionAtomically(params: {
    readonly organizationId: string;
    readonly bookingId: string;
    readonly nextStatus: BookingStatus;
    readonly amountPaidCents: number;
    readonly clearProofStorageKey: boolean;
  }): Promise<Result<void, AppError>>;
}
export interface AffectedBookingForClosure {
  readonly bookingId: string;
  readonly attendeeEmail: string;
  readonly attendeeFirstName: string;
  readonly paymentMode: PaymentMode;
  readonly paymentReference: string | null;
  readonly amountPaidCents: number;
  readonly status: BookingStatus;
}
export interface SessionClosureRepositoryPort {
  listActiveBookingsForSession(
    organizationId: string,
    sessionId: string,
  ): Promise<Result<readonly AffectedBookingForClosure[], AppError>>;
  markSessionAndBookingsCancelledByOrganizerAtomically(
    organizationId: string,
    sessionId: string,
  ): Promise<Result<void, AppError>>;
}
