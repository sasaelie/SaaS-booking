import {
  ERROR_CODES,
  INPUT_LIMITS,
  TIME,
  VOUCHER_RULES,
  VOUCHER_STATUSES,
  VOUCHER_CODE,
  ENCODING,
} from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import { addMonthsClamped, validDate } from './date-math';
import type {
  RescheduleVoucherSnapshot,
  CancellationEligibilityInput,
  CancellationEligibilityOutput,
  VoucherPricingCalculation,
} from './voucher-types';
export type {
  RescheduleVoucherSnapshot,
  CancellationEligibilityInput,
  CancellationEligibilityOutput,
  VoucherPricingCalculation,
} from './voucher-types';
export function generateFormattedVoucherCode(bytes: Uint8Array): Result<string> {
  const length = VOUCHER_RULES.CODE_SEGMENT_LENGTH * VOUCHER_CODE.SEGMENTS;
  const ceiling =
    Math.floor(ENCODING.BYTE_VALUES / VOUCHER_CODE.ALPHABET.length) * VOUCHER_CODE.ALPHABET.length;
  const characters = [...bytes]
    .filter((byte) => byte < ceiling)
    .slice(0, length)
    .map((byte) => VOUCHER_CODE.ALPHABET[byte % VOUCHER_CODE.ALPHABET.length])
    .join('');
  return characters.length === length
    ? ok(
        `${VOUCHER_RULES.CODE_PREFIX}-${characters.slice(0, VOUCHER_RULES.CODE_SEGMENT_LENGTH)}-${characters.slice(VOUCHER_RULES.CODE_SEGMENT_LENGTH)}`,
      )
    : failure(ERROR_CODES.VALIDATION_FAILED, 'Voucher', 'generateCode');
}
export function computeVoucherExpiryDate(
  issuedAt: Date,
  months: number = VOUCHER_RULES.DEFAULT_VALIDITY_MONTHS,
): Date {
  return addMonthsClamped(issuedAt, months);
}
export function evaluateCancellationEligibility(
  input: CancellationEligibilityInput,
): Result<CancellationEligibilityOutput> {
  if (
    !validDate(input.sessionStartsAt) ||
    !validDate(input.cancelledAt) ||
    !Number.isSafeInteger(input.noticeHoursRequired) ||
    input.noticeHoursRequired < 0 ||
    !validMoney(input.amountPaidCents)
  )
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Voucher', 'eligibility');
  const hoursBeforeSession =
    (input.sessionStartsAt.getTime() - input.cancelledAt.getTime()) / TIME.HOUR_MS;
  if (hoursBeforeSession <= 0 && !input.adminOverride)
    return failure(ERROR_CODES.VOUCHER_NOTICE_TOO_SHORT, 'Voucher', 'eligibility');
  const eligibleForVoucher =
    Boolean(input.adminOverride || hoursBeforeSession >= input.noticeHoursRequired) &&
    input.amountPaidCents > 0;
  return ok({
    eligibleForVoucher,
    hoursBeforeSession,
    voucherValueCents: eligibleForVoucher ? input.amountPaidCents : 0,
  });
}
function validMoney(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0 && value <= INPUT_LIMITS.MAX_CENTS;
}
export function verifyVoucherIsUsable(
  voucher: RescheduleVoucherSnapshot,
  organizationId: string,
  now: Date,
): Result<RescheduleVoucherSnapshot> {
  const lockExpired =
    voucher.status === VOUCHER_STATUSES.LOCKED_PENDING_PAYMENT &&
    voucher.lockedUntil !== null &&
    validDate(voucher.lockedUntil) &&
    voucher.lockedUntil <= now;
  if (
    voucher.organizationId !== organizationId ||
    !validDate(now) ||
    !validDate(voucher.expiresAt) ||
    now >= voucher.expiresAt ||
    !validMoney(voucher.initialValueCents) ||
    voucher.initialValueCents <= 0 ||
    !(voucher.status === VOUCHER_STATUSES.ACTIVE || lockExpired)
  )
    return failure(ERROR_CODES.VOUCHER_INVALID_OR_EXPIRED, 'Voucher', 'verify');
  return ok(
    lockExpired ? { ...voucher, status: VOUCHER_STATUSES.ACTIVE, lockedUntil: null } : voucher,
  );
}
export function calculateVoucherApplication(
  voucher: RescheduleVoucherSnapshot,
  price: number,
): Result<VoucherPricingCalculation> {
  if (
    !validMoney(price) ||
    !validMoney(voucher.initialValueCents) ||
    voucher.initialValueCents <= 0
  )
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Voucher', 'pricing');
  const appliedDiscountCents = Math.min(price, voucher.initialValueCents);
  const remainingToPayCents = price - appliedDiscountCents;
  const requiresOnlinePayment = remainingToPayCents > 0;
  return ok({
    targetActivityPriceCents: price,
    voucherInitialValueCents: voucher.initialValueCents,
    appliedDiscountCents,
    remainingToPayCents,
    forfeitedRemainderCents: 0,
    remainderValueCents: Math.max(0, voucher.initialValueCents - price),
    requiresOnlinePayment,
    nextVoucherStatus: requiresOnlinePayment
      ? VOUCHER_STATUSES.LOCKED_PENDING_PAYMENT
      : VOUCHER_STATUSES.USED_FOR_BOOKING,
  });
}
