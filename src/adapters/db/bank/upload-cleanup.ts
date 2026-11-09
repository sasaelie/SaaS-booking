import { eq } from 'drizzle-orm';
import { outboxJobs } from '../schema';
import { lockBookingContext } from '../payment/locks';
import { enqueue } from '../jobs/enqueue';
import type { Transaction } from '../transaction';
import type { BankTransferRepositoryPort } from '../../../core/ports/bank.port';
import { failure } from '../../../lib/errors';
import { ok, type Result } from '../../../lib/result';
import {
  ERROR_CODES,
  PAYMENT_MODES,
  BOOKING_STATUSES,
  JOB_TYPES,
  TIME,
} from '../../../config/constants';
export async function scheduleUploadCleanup(
  tx: Transaction,
  input: Parameters<BankTransferRepositoryPort['scheduleUploadCleanup']>[0],
): Promise<Result<void>> {
  const context = await lockBookingContext(tx, input.organizationId, input.bookingId);
  const booking = context?.booking;
  if (
    !booking ||
    !context ||
    context.session.startsAt <= input.now ||
    booking.selfServiceVersion !== input.version ||
    booking.paymentMode !== PAYMENT_MODES.BANK_TRANSFER ||
    ![BOOKING_STATUSES.PENDING_PAYMENT, BOOKING_STATUSES.PROOF_SUBMITTED].some(
      (status) => status === booking.status,
    ) ||
    !booking.lockedUntil ||
    booking.lockedUntil <= input.now
  )
    return failure(ERROR_CODES.UNAUTHORIZED, 'Bank', 'authorizeUpload');
  const key = `orphan:${input.storageKey}`;
  await enqueue(tx, input.organizationId, JOB_TYPES.PURGE, key, {
    bookingId: input.bookingId,
    storageKey: input.storageKey,
    onlyIfUnattached: true,
  });
  await tx
    .update(outboxJobs)
    .set({ availableAt: new Date(input.now.getTime() + TIME.HOUR_MS) })
    .where(eq(outboxJobs.deduplicationKey, key));
  return ok(undefined);
}
