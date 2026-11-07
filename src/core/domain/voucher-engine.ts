// src/core/domain/voucher-engine.ts
import {
  ERROR_CODES,
  VOUCHER_RULES,
  VOUCHER_STATUSES,
  type VoucherStatus,
} from '../../config/constants';
import { failAndLog } from '../../lib/logger';
import { ok, type AppError, type Result } from '../../lib/result';
const UNAMBIGUOUS_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export interface RescheduleVoucherSnapshot {
  readonly id: string;
  readonly organizationId: string;
  readonly originActivityId: string;
  readonly originBookingId: string;
  readonly code: string;
  readonly initialValueCents: number;
  readonly status: VoucherStatus;
  readonly lockedUntil: Date | null;
  readonly expiresAt: Date;
}
export interface CancellationEligibilityInput {
  readonly sessionStartsAt: Date;
  readonly cancelledAt: Date;
  readonly noticeHoursRequired: number;
  readonly amountPaidCents: number;
  readonly adminOverride?: boolean;
}
export interface CancellationEligibilityOutput {
  readonly eligibleForVoucher: boolean;
  readonly hoursBeforeSession: number;
  readonly voucherValueCents: number;
}
export interface VoucherPricingCalculation {
  readonly targetActivityPriceCents: number;
  readonly voucherInitialValueCents: number;
  readonly appliedDiscountCents: number;
  readonly remainingToPayCents: number;
  readonly forfeitedRemainderCents: number;
  readonly requiresOnlinePayment: boolean;
  readonly nextVoucherStatus: VoucherStatus;
}
export function generateFormattedVoucherCode(
  randomBytes: Uint8Array,
): Result<string, AppError> {
  const segLen = VOUCHER_RULES.CODE_SEGMENT_LENGTH;
  const requiredBytes = segLen * 2;
  if (randomBytes.length < requiredBytes) {
    return failAndLog({
      code: ERROR_CODES.VALIDATION_FAILED,
      module: 'VoucherEngine',
      fn: 'generateFormattedVoucherCode',
      cause: 'Nombre d’octets aléatoires insuffisant pour générer le code',
      received: String(randomBytes.length),
      expected: `au moins ${requiredBytes} octets`,
    });
  }
  let chars = '';
  for (let i = 0; i < requiredBytes; i += 1) {
    const byte = randomBytes[i] ?? 0;
    const char =
      UNAMBIGUOUS_ALPHABET[byte % UNAMBIGUOUS_ALPHABET.length] ?? 'A';
    chars += char;
  }
  const part1 = chars.slice(0, segLen);
  const part2 = chars.slice(segLen, segLen * 2);
  return ok(`${VOUCHER_RULES.CODE_PREFIX}-${part1}-${part2}`);
}
export function computeVoucherExpiryDate(
  issuedAt: Date,
  validityMonths: number = VOUCHER_RULES.DEFAULT_VALIDITY_MONTHS,
): Date {
  const result = new Date(issuedAt.getTime());
  result.setUTCMonth(result.getUTCMonth() + validityMonths);
  return result;
}
export function evaluateCancellationEligibility(
  input: CancellationEligibilityInput,
): Result<CancellationEligibilityOutput, AppError> {
  const diffMs = input.sessionStartsAt.getTime() - input.cancelledAt.getTime();
  const hoursBeforeSession = diffMs / 3_600_000;
  if (diffMs <= 0 && !input.adminOverride) {
    return failAndLog({
      code: ERROR_CODES.VOUCHER_NOTICE_TOO_SHORT,
      module: 'VoucherEngine',
      fn: 'evaluateCancellationEligibility',
      cause: 'Impossible d’annuler une séance déjà commencée ou passée',
      received: `${hoursBeforeSession.toFixed(1)}h`,
      expected: `>= ${input.noticeHoursRequired}h avant la séance`,
    });
  }
  const meetsNotice =
    Boolean(input.adminOverride) ||
    hoursBeforeSession >= input.noticeHoursRequired;
  const eligible = meetsNotice && input.amountPaidCents > 0;
  return ok({
    eligibleForVoucher: eligible,
    hoursBeforeSession,
    voucherValueCents: eligible ? input.amountPaidCents : 0,
  });
}
export function verifyVoucherIsUsable(
  voucher: RescheduleVoucherSnapshot,
  organizationId: string,
  now: Date,
): Result<RescheduleVoucherSnapshot, AppError> {
  if (voucher.organizationId !== organizationId) {
    return failAndLog({
      code: ERROR_CODES.VOUCHER_INVALID_OR_EXPIRED,
      module: 'VoucherEngine',
      fn: 'verifyVoucherIsUsable',
      cause: 'Code de report appartenant à une autre organisation',
      received: voucher.organizationId,
      expected: organizationId,
    });
  }
  if (now.getTime() >= voucher.expiresAt.getTime()) {
    return failAndLog({
      code: ERROR_CODES.VOUCHER_INVALID_OR_EXPIRED,
      module: 'VoucherEngine',
      fn: 'verifyVoucherIsUsable',
      cause: 'Date de validité du code de report dépassée',
      received: now.toISOString(),
      expected: `avant ${voucher.expiresAt.toISOString()}`,
    });
  }
  const isExpiredPaymentLock =
    voucher.status === VOUCHER_STATUSES.LOCKED_PENDING_PAYMENT &&
    voucher.lockedUntil !== null &&
    voucher.lockedUntil.getTime() <= now.getTime();
  const isAvailable =
    voucher.status === VOUCHER_STATUSES.ACTIVE || isExpiredPaymentLock;
  if (!isAvailable) {
    return failAndLog({
      code: ERROR_CODES.VOUCHER_INVALID_OR_EXPIRED,
      module: 'VoucherEngine',
      fn: 'verifyVoucherIsUsable',
      cause:
        'Code de report déjà utilisé ou verrouillé par un paiement en cours',
      received: voucher.status,
      expected: VOUCHER_STATUSES.ACTIVE,
    });
  }
  return ok(voucher);
}
export function calculateVoucherApplication(
  voucher: RescheduleVoucherSnapshot,
  targetActivityPriceCents: number,
): Result<VoucherPricingCalculation, AppError> {
  if (
    !Number.isInteger(targetActivityPriceCents) ||
    targetActivityPriceCents < 0
  ) {
    return failAndLog({
      code: ERROR_CODES.VALIDATION_FAILED,
      module: 'VoucherEngine',
      fn: 'calculateVoucherApplication',
      cause: 'Prix de l’activité cible invalide',
      received: String(targetActivityPriceCents),
      expected: 'entier >= 0',
    });
  }
  const appliedDiscountCents = Math.min(
    voucher.initialValueCents,
    targetActivityPriceCents,
  );
  const remainingToPayCents = Math.max(
    0,
    targetActivityPriceCents - voucher.initialValueCents,
  );
  const forfeitedRemainderCents = Math.max(
    0,
    voucher.initialValueCents - targetActivityPriceCents,
  );
  const requiresOnlinePayment = remainingToPayCents > 0;
  return ok({
    targetActivityPriceCents,
    voucherInitialValueCents: voucher.initialValueCents,
    appliedDiscountCents,
    remainingToPayCents,
    forfeitedRemainderCents,
    requiresOnlinePayment,
    nextVoucherStatus: requiresOnlinePayment
      ? VOUCHER_STATUSES.LOCKED_PENDING_PAYMENT
      : VOUCHER_STATUSES.USED_FOR_BOOKING,
  });
}
