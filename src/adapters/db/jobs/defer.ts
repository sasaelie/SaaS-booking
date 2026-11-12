import { eq } from 'drizzle-orm';
import { outboxJobs } from '../schema';
import type { Transaction } from '../transaction';
import { JOB_RULES, TIME, type ErrorCode } from '../../../config/constants';
export function deferJob(
  tx: Transaction,
  job: typeof outboxJobs.$inferSelect,
  error: ErrorCode,
  payload = job.payload,
) {
  return tx
    .update(outboxJobs)
    .set({
      attempts: job.attempts + 1,
      lastError: error,
      availableAt: new Date(Date.now() + JOB_RULES.RETRY_MINUTES * TIME.MINUTE_MS),
      payload,
    })
    .where(eq(outboxJobs.id, job.id));
}
