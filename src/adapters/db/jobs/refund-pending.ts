import { sql } from 'drizzle-orm';
import { outboxJobs } from '../schema';
import type { Transaction } from '../transaction';
import type { JobEffect } from '../../../core/ports/jobs.port';
import { ERROR_CODES } from '../../../config/constants';
import { REFUND_STATES } from '../../../config/refunds';
import { RefundJobSchema } from '../../jobs/job-validation';
import { deferJob } from './defer';
export async function deferRefund(
  tx: Transaction,
  job: typeof outboxJobs.$inferSelect,
  effect: JobEffect,
) {
  const valid = effect.refundId && effect.status;
  const payload = valid
    ? {
        ...RefundJobSchema.parse(job.payload),
        refundId: effect.refundId,
        refundStatus: effect.status,
      }
    : job.payload;
  const error = !valid
    ? ERROR_CODES.VALIDATION_FAILED
    : effect.status === REFUND_STATES.FAILED
      ? ERROR_CODES.PAYMENT_PROVIDER_ERROR
      : ERROR_CODES.CONFLICT;
  await deferJob(tx, job, error, payload);
  if (!valid) return;
  const input = RefundJobSchema.parse(payload);
  await tx.execute(sql`UPDATE bookings SET refund_status='PENDING',
    refund_id=${effect.refundId},refund_updated_at=now()
    WHERE id=${input.bookingId} AND organization_id=${job.organizationId} AND payment_reference=${input.paymentReference}
      AND refund_status IS DISTINCT FROM 'REFUNDED'`);
}
