import { eq } from 'drizzle-orm';
import { bookings, organizations } from '../schema';
import type { Transaction } from '../transaction';
import type { BookingRow } from '../reservation/context';
import { lockBookingContext } from '../payment/locks';
import { canConfirm } from '../payment/confirm';
import { releaseVoucher } from '../vouchers/release';
import { enqueue } from '../jobs/enqueue';
import { ok, type Result } from '../../../lib/result';
import { failure } from '../../../lib/errors';
import { ERROR_CODES, BOOKING_STATUSES, PAYMENT_MODES, JOB_TYPES } from '../../../config/constants';
import type { BankTransferRepositoryPort } from '../../../core/ports/bank.port';
function decisionValues(booking: BookingRow, approved: boolean, now: Date) {
  return {
    status: approved ? BOOKING_STATUSES.CONFIRMED : BOOKING_STATUSES.CANCELLED_BY_ORGANIZER,
    amountPaidCents: approved ? booking.unitPriceCents - booking.voucherDiscountCents : 0,
    paidAt: approved ? now : null,
    confirmedAt: approved ? now : null,
    cancelledAt: approved ? null : now,
    lockedUntil: null,
  };
}
async function decisionEffects(
  tx: Transaction,
  booking: BookingRow,
  approved: boolean,
  proofStorageKey: string | null,
): Promise<void> {
  if (!approved) await releaseVoucher(tx, booking);
  if (approved)
    await enqueue(
      tx,
      booking.organizationId,
      JOB_TYPES.CONFIRMATION,
      `confirmation:${booking.id}`,
      { bookingId: booking.id },
    );
  if (proofStorageKey)
    await enqueue(tx, booking.organizationId, JOB_TYPES.PURGE, `purge:${proofStorageKey}`, {
      bookingId: booking.id,
      storageKey: proofStorageKey,
    });
}
export async function decideBankTransfer(
  tx: Transaction,
  input: Parameters<BankTransferRepositoryPort['finalizeAdminBankDecisionAtomically']>[0],
): Promise<Result<{ readonly proofStorageKey: string | null }>> {
  const context = await lockBookingContext(tx, input.organizationId, input.bookingId);
  if (!context || context.booking.paymentMode !== PAYMENT_MODES.BANK_TRANSFER)
    return failure(ERROR_CODES.NOT_FOUND, 'Bank', 'decide');
  const { booking } = context;
  const proofStorageKey = await proofToPurge(tx, booking);
  const approved = input.decision === 'APPROVE';
  if (
    booking.status ===
    (approved ? BOOKING_STATUSES.CONFIRMED : BOOKING_STATUSES.CANCELLED_BY_ORGANIZER)
  )
    return ok({ proofStorageKey });
  if (booking.status !== BOOKING_STATUSES.PROOF_SUBMITTED)
    return failure(ERROR_CODES.CONFLICT, 'Bank', 'decide');
  if (approved && !(await canConfirm(tx, context, input.now)))
    return failure(ERROR_CODES.SESSION_FULL, 'Bank', 'decide');
  await tx
    .update(bookings)
    .set(decisionValues(booking, approved, input.now))
    .where(eq(bookings.id, booking.id));
  await decisionEffects(tx, booking, approved, proofStorageKey);
  return ok({ proofStorageKey });
}

async function proofToPurge(tx: Transaction, booking: BookingRow): Promise<string | null> {
  const [organization] = await tx
    .select({ autoDelete: organizations.autoDeleteBankProof })
    .from(organizations)
    .where(eq(organizations.id, booking.organizationId));
  return organization?.autoDelete ? booking.proofStorageKey : null;
}
