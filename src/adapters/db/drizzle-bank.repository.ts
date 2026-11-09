import { scheduleUploadCleanup } from './bank/upload-cleanup';
import { and, eq } from 'drizzle-orm';
import { bookings } from './schema';
import { atomic } from './transaction';
import type { DrizzlePgDb } from './client';
import { lockBookingContext } from './payment/locks';
import { decideBankTransfer } from './bank/decision';
import { enqueue } from './jobs/enqueue';
import { ok, type Result } from '../../lib/result';
import { failure, unexpected } from '../../lib/errors';
import { ERROR_CODES, BOOKING_STATUSES, PAYMENT_MODES, JOB_TYPES } from '../../config/constants';
import type { BankTransferRepositoryPort } from '../../core/ports/bank.port';
export class DrizzleBankRepository implements BankTransferRepositoryPort {
  constructor(private readonly db: DrizzlePgDb) {}
  acknowledgeProofDeletion(
    organizationId: string,
    bookingId: string,
    storageKey: string,
  ): Promise<Result<void>> {
    return atomic(this.db, 'Bank', async (tx) => {
      await tx
        .update(bookings)
        .set({ proofStorageKey: null })
        .where(
          and(
            eq(bookings.id, bookingId),
            eq(bookings.organizationId, organizationId),
            eq(bookings.proofStorageKey, storageKey),
          ),
        );
      return ok(undefined);
    });
  }
  scheduleUploadCleanup(
    input: Parameters<BankTransferRepositoryPort['scheduleUploadCleanup']>[0],
  ): Promise<Result<void>> {
    return atomic(this.db, 'Bank', (tx) => scheduleUploadCleanup(tx, input));
  }
  attachProofToBookingAtomically(
    input: Parameters<BankTransferRepositoryPort['attachProofToBookingAtomically']>[0],
  ): Promise<Result<void>> {
    return atomic(this.db, 'Bank', async (tx) => {
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
        return failure(ERROR_CODES.CONFLICT, 'Bank', 'attach');
      await tx
        .update(bookings)
        .set({
          proofStorageKey: input.proofStorageKey,
          status: BOOKING_STATUSES.PROOF_SUBMITTED,
        })
        .where(eq(bookings.id, booking.id));
      if (booking.proofStorageKey)
        await enqueue(
          tx,
          booking.organizationId,
          JOB_TYPES.PURGE,
          `purge:${booking.proofStorageKey}`,
          { bookingId: booking.id, storageKey: booking.proofStorageKey },
        );
      return ok(undefined);
    });
  }
  finalizeAdminBankDecisionAtomically(
    input: Parameters<BankTransferRepositoryPort['finalizeAdminBankDecisionAtomically']>[0],
  ): Promise<Result<{ readonly proofStorageKey: string | null }>> {
    return atomic(this.db, 'Bank', (tx) => decideBankTransfer(tx, input));
  }
  async getProofForAdmin(
    organizationId: string,
    bookingId: string,
  ): Promise<Result<{ readonly storageKey: string }>> {
    try {
      const [booking] = await this.db
        .select()
        .from(bookings)
        .where(and(eq(bookings.id, bookingId), eq(bookings.organizationId, organizationId)));
      return booking?.proofStorageKey
        ? ok({ storageKey: booking.proofStorageKey })
        : failure(ERROR_CODES.NOT_FOUND, 'Bank', 'proof');
    } catch {
      return unexpected('Bank', 'proof');
    }
  }
}
