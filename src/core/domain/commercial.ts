import { COMMERCIAL } from '../../config/commercial';
import { PAYMENT_MODES, type PaymentMode } from '../../config/constants';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import { CommercialQuoteSchema, type CommercialQuote } from '../validation/commercial';
import type { OrganizationAccess } from './subscription-access';
export function canUsePro(access: OrganizationAccess, now: Date): boolean {
  if (access.suspendedAt || !Number.isFinite(now.getTime())) return false;
  return (
    access.complimentary ||
    Boolean(access.graceUntil && access.graceUntil > now) ||
    Boolean(access.status === 'ACTIVE' && access.currentPeriodEnd && access.currentPeriodEnd > now)
  );
}
export function effectivePlan(access: OrganizationAccess, now: Date) {
  return canUsePro(access, now) ? COMMERCIAL.PRO : COMMERCIAL.LIBERTE;
}
export function effectivePaymentMode(mode: PaymentMode, price: number, pro: boolean): PaymentMode {
  if (price === 0) return PAYMENT_MODES.NONE;
  return !pro && mode !== PAYMENT_MODES.STRIPE ? PAYMENT_MODES.STRIPE : mode;
}
export function commercialQuote(raw: unknown): Result<CommercialQuote> {
  const parsed = CommercialQuoteSchema.safeParse(raw);
  if (!parsed.success) return failure(ERROR_CODES.VALIDATION_FAILED, 'Commercial', 'quote');
  const { plan, amountCents } = parsed.data;
  if (amountCents > 0 && amountCents < COMMERCIAL.STRIPE_MINIMUM_CENTS)
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Commercial', 'minimum');
  const commissionCents =
    plan === COMMERCIAL.LIBERTE && amountCents > 0
      ? Math.floor(
          (amountCents * COMMERCIAL.COMMISSION_BPS + COMMERCIAL.ROUND_HALF) / COMMERCIAL.BPS_SCALE,
        ) + COMMERCIAL.COMMISSION_FIXED_CENTS
      : 0;
  return ok({
    plan,
    amountCents,
    commissionCents,
    organizationNetCents:
      plan === COMMERCIAL.LIBERTE ? amountCents - commissionCents : amountCents === 0 ? 0 : null,
    ruleVersion: COMMERCIAL.RULE_VERSION,
  });
}
