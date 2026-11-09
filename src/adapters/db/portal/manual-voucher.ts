import type { Transaction } from '../transaction';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { ManualVoucherInput } from '../../../core/validation/manual-voucher';
import { requireMembership } from './authorization';
import { lockBookingContext } from '../payment/locks';
import { existingVoucher, issueCancellationVoucher } from '../vouchers/issue';
import { platformAudit } from '../schema/saas';
import { rescheduleVouchers } from '../schema';
import { eq } from 'drizzle-orm';
import { newVoucherCode } from '../vouchers/code';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
export async function issueManualVoucher(
  tx: Transaction,
  actor: PortalActor,
  input: ManualVoucherInput,
) {
  await requireMembership(tx, actor, input.organizationId);
  const context = await lockBookingContext(tx, input.organizationId, input.bookingId);
  if (!context) return failure(ERROR_CODES.NOT_FOUND, 'ManualVoucher', 'booking');
  if (!eligible(context)) return failure(ERROR_CODES.CONFLICT, 'ManualVoucher', 'state');
  if (await existingVoucher(tx, input.organizationId, input.bookingId)) return ok(undefined);
  const now = new Date();
  const expiresAt = new Date(input.expiresAt);
  if (expiresAt <= now) return failure(ERROR_CODES.VALIDATION_FAILED, 'ManualVoucher', 'expiry');
  const code = newVoucherCode();
  const voucher = await issueCancellationVoucher(tx, context, {
    ...input,
    version: null,
    adminOverride: true,
    code,
    now,
  });
  if (!voucher) return failure(ERROR_CODES.CONFLICT, 'ManualVoucher', 'unpaid');
  await tx
    .update(rescheduleVouchers)
    .set({ expiresAt })
    .where(eq(rescheduleVouchers.id, voucher.id));
  await tx.insert(platformAudit).values({
    organizationId: input.organizationId,
    actorUserId: actor.id,
    action: 'MANUAL_VOUCHER_GRANTED',
  });
  return ok(undefined);
}

function eligible(context: import('../payment/locks').LockedBooking) {
  const b = context.booking;
  return (
    b.status === 'CANCELLED_BY_ATTENDEE' &&
    Boolean(b.confirmedAt) &&
    !b.refundStatus &&
    !b.anonymizedAt &&
    (!context.voucher || context.voucher.status === 'USED_FOR_BOOKING')
  );
}
