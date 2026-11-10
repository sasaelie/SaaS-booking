import { scheduleReminders } from './reminders';
import { cancellationScope, type CancellationScope } from './job-filter';
import { sql, eq } from 'drizzle-orm';
import { outboxJobs } from '../schema';
import { rows, atomic, type Transaction } from '../transaction';
import type { DrizzlePgDb } from '../client';
import type { JobHandlerPort, JobRunnerPort } from '../../../core/ports/jobs.port';
import { JOB_RULES, JOB_TYPES, TIME } from '../../../config/constants';
import { ok, type Result } from '../../../lib/result';
import { RefundJobSchema, PurgeJobSchema } from '../../jobs/job-validation';
async function completeEffect(
  tx: Transaction,
  job: typeof outboxJobs.$inferSelect,
  effect: import('../../../core/ports/jobs.port').JobEffect,
): Promise<void> {
  const { refundId } = effect;
  if (job.type === JOB_TYPES.PURGE && !effect.preserveProof) {
    const payload = PurgeJobSchema.parse(job.payload);
    await tx.execute(
      sql`UPDATE bookings SET proof_storage_key=NULL WHERE id=${payload.bookingId} AND organization_id=${job.organizationId} AND proof_storage_key=${payload.storageKey}`,
    );
  }
  if (job.type === JOB_TYPES.REFUND && refundId) {
    const payload = RefundJobSchema.parse(job.payload);
    await tx.execute(
      sql`UPDATE bookings SET refund_status='REFUNDED',refund_id=${refundId} WHERE id=${payload.bookingId} AND organization_id=${job.organizationId} AND payment_reference=${payload.paymentReference}`,
    );
  }
  await tx
    .update(outboxJobs)
    .set({
      completedAt: new Date(),
      lastError: null,
      payload: refundId ? { ...RefundJobSchema.parse(job.payload), refundId } : job.payload,
    })
    .where(eq(outboxJobs.id, job.id));
}
async function runOne(
  tx: Transaction,
  handler: JobHandlerPort,
  scope?: CancellationScope,
): Promise<'completed' | 'deferred' | 'empty'> {
  const [candidate] = await rows<{ id: string }>(
    tx,
    sql`SELECT id FROM outbox_jobs WHERE completed_at IS NULL AND available_at<=now() ${cancellationScope(scope)} ORDER BY available_at,id FOR UPDATE SKIP LOCKED LIMIT 1`,
  );
  if (!candidate) return 'empty';
  const [job] = await tx.select().from(outboxJobs).where(eq(outboxJobs.id, candidate.id));
  if (!job) return 'empty';
  const result = await handler.execute(job.type, job.payload, job.deduplicationKey);
  if (result.ok) {
    await completeEffect(tx, job, result.value);
    return 'completed';
  }
  await tx
    .update(outboxJobs)
    .set({
      attempts: job.attempts + 1,
      lastError: result.error.code,
      availableAt: new Date(Date.now() + JOB_RULES.RETRY_MINUTES * TIME.MINUTE_MS),
    })
    .where(eq(outboxJobs.id, job.id));
  return 'deferred';
}
export class DrizzleJobRunner implements JobRunnerPort {
  constructor(
    private readonly db: DrizzlePgDb,
    private readonly handler: JobHandlerPort,
  ) {}
  async runBatch(): Promise<Result<{ readonly completed: number; readonly deferred: number }>> {
    const scheduled = await scheduleReminders(this.db);
    if (!scheduled.ok) return scheduled;
    return this.drain(JOB_RULES.BATCH_SIZE);
  }
  runCancellationBatch(organizationId: string, bookingIds: readonly string[]) {
    return bookingIds.length
      ? this.drain(bookingIds.length, { organizationId, bookingIds })
      : Promise.resolve(ok({ completed: 0, deferred: 0 }));
  }
  private async drain(limit: number, scope?: CancellationScope) {
    let completed = 0;
    let deferred = 0;
    for (let count = 0; count < limit; count++) {
      const result = await atomic(this.db, 'Jobs', async (tx) =>
        ok(await runOne(tx, this.handler, scope)),
      );
      if (!result.ok) return result;
      if (result.value === 'empty') break;
      if (result.value === 'completed') completed++;
      else deferred++;
    }
    return ok({ completed, deferred });
  }
}
