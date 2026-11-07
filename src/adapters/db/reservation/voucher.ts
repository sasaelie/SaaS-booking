import { eq, and } from 'drizzle-orm';
import { rescheduleVouchers } from '../schema';
import type { Transaction } from '../transaction';
import { required } from '../transaction';
import {
  verifyVoucherIsUsable,
  calculateVoucherApplication,
} from '../../../core/domain/voucher-engine';
import { ok, type Result } from '../../../lib/result';
import { failure } from '../../../lib/errors';
import { ERROR_CODES, VOUCHER_STATUSES } from '../../../config/constants';
export interface VoucherApplication {
  readonly id: string | null;
  readonly discount: number;
  readonly remaining: number;
}
export async function prepareVoucher(
  tx: Transaction,
  organizationId: string,
  code: string | null,
  price: number,
  currency: string,
  now: Date,
): Promise<Result<VoucherApplication>> {
  if (!code) return ok({ id: null, discount: 0, remaining: price });
  const [voucher] = await tx
    .select()
    .from(rescheduleVouchers)
    .where(
      and(eq(rescheduleVouchers.organizationId, organizationId), eq(rescheduleVouchers.code, code)),
    )
    .for('update');
  if (!voucher || voucher.currency !== currency)
    return failure(ERROR_CODES.VOUCHER_INVALID_OR_EXPIRED, 'Voucher', 'prepareVoucher');
  required(verifyVoucherIsUsable(voucher, organizationId, now));
  const priceResult = required(calculateVoucherApplication(voucher, price));
  return ok({
    id: voucher.id,
    discount: priceResult.appliedDiscountCents,
    remaining: priceResult.remainingToPayCents,
  });
}
export async function consumeVoucher(
  tx: Transaction,
  voucher: VoucherApplication,
  bookingId: string,
  lockedUntil: Date | null,
  now: Date,
): Promise<void> {
  if (!voucher.id) return;
  await tx
    .update(rescheduleVouchers)
    .set({
      status: lockedUntil
        ? VOUCHER_STATUSES.LOCKED_PENDING_PAYMENT
        : VOUCHER_STATUSES.USED_FOR_BOOKING,
      lockedBookingId: lockedUntil ? bookingId : null,
      lockedUntil,
      usedAt: lockedUntil ? null : now,
    })
    .where(eq(rescheduleVouchers.id, voucher.id));
}
