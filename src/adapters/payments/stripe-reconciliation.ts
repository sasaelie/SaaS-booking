import type Stripe from 'stripe';
import type { FinancialPaymentInput, ReconciledPayment } from '../../core/ports/financial.port';
import { ok, type Result } from '../../lib/result';
import { failure } from '../../lib/errors';
import { ERROR_CODES } from '../../config/constants';
export async function reconcileStripePayment(
  stripe: Stripe,
  input: FinancialPaymentInput,
): Promise<Result<ReconciledPayment | null>> {
  try {
    const intent = await stripe.paymentIntents.retrieve(
      input.paymentReference,
      {
        expand: [
          'latest_charge.balance_transaction',
          'latest_charge.application_fee',
          'latest_charge.transfer',
        ],
      },
      input.chargeModel === 'DIRECT' && input.merchantAccountId
        ? { stripeAccount: input.merchantAccountId }
        : {},
    );
    if (
      intent.metadata['organization_id'] !== input.organizationId ||
      intent.metadata['booking_id'] !== input.bookingId
    )
      return failure(ERROR_CODES.UNAUTHORIZED, 'Reconciliation', 'scope');
    const valid = validateDestination(intent, input);
    if (!valid.ok) return valid;
    const expanded = expandedCharge(intent, input);
    if (!expanded) return ok(null);
    const { charge, balance } = expanded;
    const refunds = await refundValues(stripe, charge, input);
    return ok({ ...chargeValues(charge, balance), refunds });
  } catch {
    return failure(ERROR_CODES.PAYMENT_PROVIDER_ERROR, 'Reconciliation', 'retrieve');
  }
}

function chargeValues(
  charge: Stripe.Charge,
  balance: Stripe.BalanceTransaction,
): ReconciledPayment {
  const transferId =
    typeof charge.transfer === 'string' ? charge.transfer : (charge.transfer?.id ?? null);
  return {
    transferredCents:
      charge.transfer &&
      typeof charge.transfer !== 'string' &&
      charge.application_fee &&
      typeof charge.application_fee !== 'string'
        ? charge.transfer.amount -
          charge.transfer.amount_reversed -
          charge.application_fee.amount +
          charge.application_fee.amount_refunded
        : null,
    chargeId: charge.id,
    balanceTransactionId: balance.id,
    amountCents: charge.amount,
    stripeFeeCents: balance.fee,
    currency: balance.currency.toUpperCase(),
    transferId,
    refundedCents: charge.amount_refunded,
    commissionRefundedCents:
      charge.application_fee && typeof charge.application_fee !== 'string'
        ? charge.application_fee.amount_refunded
        : 0,
  };
}

function validateDestination(intent: Stripe.PaymentIntent, input: FinancialPaymentInput) {
  if (
    input.chargeModel === 'DESTINATION' &&
    (typeof intent.transfer_data?.destination === 'string'
      ? intent.transfer_data.destination
      : intent.transfer_data?.destination?.id) !== input.merchantAccountId
  )
    return failure(ERROR_CODES.UNAUTHORIZED, 'Reconciliation', 'destination');
  if (
    input.chargeModel === 'DESTINATION' &&
    input.commissionCents !== undefined &&
    intent.application_fee_amount !== input.commissionCents
  )
    return failure(ERROR_CODES.CONFLICT, 'Reconciliation', 'commission');
  return ok(undefined);
}
async function refundValues(stripe: Stripe, charge: Stripe.Charge, input: FinancialPaymentInput) {
  const refunds: { id: string; amountCents: number }[] = [];
  if (!charge.amount_refunded) return refunds;
  for await (const refund of stripe.refunds.list(
    { charge: charge.id },
    input.chargeModel === 'DIRECT' && input.merchantAccountId
      ? { stripeAccount: input.merchantAccountId }
      : {},
  ))
    if (refund.status === 'succeeded') refunds.push({ id: refund.id, amountCents: refund.amount });
  return refunds;
}

function expandedCharge(intent: Stripe.PaymentIntent, input: FinancialPaymentInput) {
  const charge = intent.latest_charge;
  if (
    !charge ||
    typeof charge === 'string' ||
    !charge.balance_transaction ||
    typeof charge.balance_transaction === 'string'
  )
    return null;
  const balance = charge.balance_transaction;
  if (
    intent.status !== 'succeeded' ||
    balance.currency !== 'eur' ||
    (input.chargeModel === 'DESTINATION' &&
      (!charge.application_fee || typeof charge.application_fee === 'string'))
  )
    return null;
  return { charge, balance };
}
