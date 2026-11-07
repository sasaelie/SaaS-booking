import type { Result } from '../../lib/result';
export interface JobEffect {
  readonly preserveProof?: true;
  readonly refundId?: string;
}
export interface JobHandlerPort {
  execute(type: string, payload: unknown, idempotencyKey: string): Promise<Result<JobEffect>>;
}
export interface JobRunnerPort {
  runBatch(): Promise<Result<{ readonly completed: number; readonly deferred: number }>>;
}
