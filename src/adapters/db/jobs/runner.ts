import { scheduleReminders } from './reminders';
import { type CancellationScope } from './job-filter';
import { sql, eq, and, isNull } from 'drizzle-orm';
import { outboxJobs } from '../schema';
import { atomic, type Transaction } from '../transaction';
import type { DrizzlePgDb } from '../client';
import type { JobHandlerPort, JobRunnerPort, JobEffect } from '../../../core/ports/jobs.port';
import { JOB_RULES, JOB_TYPES } from '../../../config/constants';
import { REFUND_STATES } from '../../../config/refunds';
import { deferJob } from './defer';
import { deferRefund } from './refund-pending';
import { claimJob } from './claim';
import { guardUseCase } from '../../../lib/guard-use-case';
import { ok, type Result } from '../../../lib/result';
import { RefundJobSchema, PurgeJobSchema } from '../../jobs/job-validation';
import { recordFinancialRefund } from '../financial-ledger';
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
    await recordFinancialRefund(tx, payload.bookingId, refundId, payload.amountCents);
    await tx.execute(
      sql`UPDATE bookings SET refund_updated_at=now() WHERE id=${payload.bookingId} AND organization_id=${job.organizationId}`,
    );
  }
  await tx
    .update(outboxJobs)
    .set({
      completedAt: new Date(),
      lastError: null,
      payload: refundId
        ? { ...RefundJobSchema.parse(job.payload), refundId, refundStatus: REFUND_STATES.SUCCEEDED }
        : job.payload,
    })
    .where(eq(outboxJobs.id, job.id));
}
async function finishJob(
  tx: Transaction,
  job: typeof outboxJobs.$inferSelect,
  result: Result<JobEffect>,
): Promise<'completed' | 'deferred' | 'empty'> {
  const [current] = await tx
    .select({ id: outboxJobs.id })
    .from(outboxJobs)
    .where(
      and(
        eq(outboxJobs.id, job.id),
        eq(outboxJobs.availableAt, job.availableAt),
        isNull(outboxJobs.completedAt),
      ),
    )
    .for('update');
  if (!current) return 'deferred';
  if (result.ok) {
    if (
      job.type === JOB_TYPES.REFUND &&
      (!result.value.refundId || result.value.status !== REFUND_STATES.SUCCEEDED)
    ) {
      await deferRefund(tx, job, result.value);
      return 'deferred';
    }
    await completeEffect(tx, job, result.value);
    return 'completed';
  }
  await deferJob(tx, job, result.error.code);
  return 'deferred';
}
async function runOne(db: DrizzlePgDb, handler: JobHandlerPort, scope?: CancellationScope) {
  const claimed = await claimJob(db, scope);
  if (!claimed.ok) return claimed;
  if (!claimed.value) return ok('empty' as const);
  const job = claimed.value;
  const result = await guardUseCase('Jobs', 'effect', () =>
    handler.execute(job.type, job.payload, job.deduplicationKey),
  );
  return atomic(db, 'Jobs', async (tx) => ok(await finishJob(tx, job, result)));
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
      const result = await runOne(this.db, this.handler, scope);
      if (!result.ok) return result;
      if (result.value === 'empty') break;
      if (result.value === 'completed') completed++;
      else deferred++;
    }
    return ok({ completed, deferred });
  }
}
