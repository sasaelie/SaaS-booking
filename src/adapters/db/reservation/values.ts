import type { bookings } from '../schema';
import type { InsertContext, prepareReservation } from './prepare';
import type { initialState } from './state';
import { commercialQuote } from '../../../core/domain/commercial';
import { required } from '../transaction';
import { COMMERCIAL } from '../../../config/commercial';
type Prepared = Awaited<ReturnType<typeof prepareReservation>>;
function attendeeValues(data: Prepared['data']) {
  const { firstName, lastName, email, phone, marketingOptIn } = data;
  return { firstName, lastName, email, phone, marketingOptIn };
}
function termsValues(prepared: Prepared, now: Date) {
  return {
    termsAcceptedAt: now,
    termsVersionHash: prepared.terms.versionHash,
    termsText: prepared.terms.fullText,
    ageAttestationLabel: prepared.terms.ageAttestationLabel,
  };
}
export function reservationValues(
  context: InsertContext,
  prepared: Prepared,
  id: string,
  state: ReturnType<typeof initialState>,
  paymentReference: string | null,
): typeof bookings.$inferInsert {
  const { activity, input, now } = context;
  return {
    ...pricingSnapshot(activity, prepared.voucher.remaining, state.paymentMode),
    id,
    paymentReference,
    activityName: activity.name,
    noticeHoursForVoucher: activity.noticeHoursForVoucher,
    voucherValidityMonths: activity.voucherValidityMonths,
    merchantAccountId: activity.merchantAccountId,
    bankIban: activity.bankIban,
    bankAccountName: activity.bankAccountName,
    organizationId: activity.organizationId,
    activityId: activity.id,
    sessionId: prepared.session.id,
    idempotencyKey: prepared.data.idempotencyKey,
    requestHash: input.requestHash,
    ...attendeeValues(prepared.data),
    unitPriceCents: activity.priceCents,
    voucherDiscountCents: prepared.voucher.discount,
    amountPaidCents: 0,
    currency: activity.currency,
    appliedVoucherId: prepared.voucher.id,
    ...state,
    ...termsValues(prepared, now),
  };
}

function pricingSnapshot(activity: InsertContext['activity'], remaining: number, mode: string) {
  const quote = required(
    commercialQuote({
      plan: activity.commercialPlan ?? COMMERCIAL.PRO,
      amountCents: mode === 'NONE' ? 0 : remaining,
    }),
  );
  return {
    commercialPlan: quote.plan,
    pricingVersion: quote.ruleVersion,
    commissionCents: quote.commissionCents,
    chargeModel:
      quote.plan === COMMERCIAL.LIBERTE && quote.amountCents > 0
        ? COMMERCIAL.DESTINATION
        : COMMERCIAL.DIRECT,
  };
}
