import type { Transaction } from '../transaction';
import type { LockedBooking } from '../payment/locks';
import type { CancellationInput } from '../../../core/ports/voucher.port';
import { BOOKING_STATUSES, JOB_TYPES } from '../../../config/constants';
import { issueCancellationVoucher } from './issue';
import { releaseVoucher } from './release';
import { enqueue } from '../jobs/enqueue';
export async function attendeeCancellationEffects(
  tx: Transaction,
  context: LockedBooking,
  input: CancellationInput,
) {
  const { booking } = context;
  if (booking.status === BOOKING_STATUSES.CONFIRMED)
    return issueCancellationVoucher(tx, context, input);
  await releaseVoucher(tx, booking);
  if (booking.proofStorageKey)
    await enqueue(tx, booking.organizationId, JOB_TYPES.PURGE, `purge:${booking.proofStorageKey}`, {
      bookingId: booking.id,
      storageKey: booking.proofStorageKey,
    });
  return null;
}
export function canCancelAttendee(context: LockedBooking, input: CancellationInput) {
  if (context.booking.status === BOOKING_STATUSES.CONFIRMED) return true;
  return (
    [BOOKING_STATUSES.PENDING_PAYMENT, BOOKING_STATUSES.PROOF_SUBMITTED].some(
      (status) => status === context.booking.status,
    ) &&
    (context.session.startsAt > input.now || input.adminOverride)
  );
}
