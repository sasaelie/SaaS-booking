import type { Result } from '../../lib/result';
export interface CloseSessionInput {
  readonly organizationId: string;
  readonly sessionId: string;
  readonly confirmCancelExistingBookings: boolean;
  readonly confirmationHash?: string;
  readonly reason: string;
}
export type CloseSessionOutcome =
  | {
      readonly status: 'CONFIRMATION_REQUIRED';
      readonly affectedBookingsCount: number;
      readonly confirmationHash: string;
    }
  | {
      readonly status: 'CLOSED_AND_REFUNDS_QUEUED';
      readonly cancelledBookingsCount: number;
    };
export interface SessionClosureRepositoryPort {
  closeSessionAtomically(input: CloseSessionInput): Promise<Result<CloseSessionOutcome>>;
}
