import type { Result } from '../../lib/result';
import type { CloseSessionOutcome } from './closure.port';
export interface AddPauseInput {
  readonly organizationId: string;
  readonly activityId: string;
  readonly startsAt: Date;
  readonly endsAt: Date;
  readonly reason: string;
  readonly confirmCancelExistingBookings: boolean;
  readonly confirmationHash?: string;
}
export interface PauseRepositoryPort {
  addPauseAtomically(input: AddPauseInput): Promise<Result<CloseSessionOutcome>>;
}
