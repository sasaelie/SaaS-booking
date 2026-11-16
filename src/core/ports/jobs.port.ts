import type { Result } from '../../lib/result';
export interface JobEffect {
  readonly preserveProof?: true;
  readonly refundId?: string;
  readonly status?: import('../../config/refunds').RefundState;
}
export interface JobHandlerPort {
  execute(type: string, payload: unknown, idempotencyKey: string): Promise<Result<JobEffect>>;
}
export interface JobRunnerPort {
  runConfirmation(
    organizationId: string,
    bookingId: string,
  ): Promise<Result<{ readonly completed: number; readonly deferred: number }>>;
  runCancellationBatch(
    organizationId: string,
    bookingIds: readonly string[],
  ): Promise<Result<{ readonly completed: number; readonly deferred: number }>>;
  runBatch(): Promise<Result<{ readonly completed: number; readonly deferred: number }>>;
}
