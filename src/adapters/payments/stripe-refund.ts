import type Stripe from 'stripe';
import type {
  RefundPaymentInput,
  RefundPaymentOutput,
} from '../../core/ports/payment-gateway.port';
import { StripeAmountSchema } from './stripe-validation';
import { ERROR_CODES } from '../../config/constants';
import { REFUND_STATES } from '../../config/refunds';
import { canCreateRefund } from '../../core/domain/refund-attempt';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
export async function refundStripePayment(
  stripe: Stripe,
  input: RefundPaymentInput,
): Promise<Result<RefundPaymentOutput>> {
  try {
    if (!StripeAmountSchema.safeParse(input.amountCents).success)
      return failure(ERROR_CODES.VALIDATION_FAILED, 'Stripe', 'refundPayment');
    if (!input.refundId && !canCreateRefund(input.firstAttemptAt, new Date()))
      return failure(ERROR_CODES.CONFLICT, 'Stripe', 'refund-needs-reconciliation');
    const options =
      input.chargeModel !== 'DESTINATION' && input.merchantAccountId
        ? { stripeAccount: input.merchantAccountId }
        : {};
    const refund = input.refundId
      ? await stripe.refunds.retrieve(input.refundId, {}, options)
      : await stripe.refunds.create(
          {
            payment_intent: input.paymentReference,
            amount: input.amountCents,
            reason: 'requested_by_customer',
            ...(input.chargeModel === 'DESTINATION'
              ? { reverse_transfer: true, refund_application_fee: true }
              : {}),
          },
          { ...options, idempotencyKey: input.idempotencyKey },
        );
    const intent =
      typeof refund.payment_intent === 'string' ? refund.payment_intent : refund.payment_intent?.id;
    if (refund.amount !== input.amountCents || intent !== input.paymentReference)
      return failure(ERROR_CODES.CONFLICT, 'Stripe', 'refund-scope');
    return ok({ refundId: refund.id, status: refundState(refund.status) });
  } catch {
    return failure(ERROR_CODES.PAYMENT_PROVIDER_ERROR, 'Stripe', 'refundPayment');
  }
}
function refundState(status: Stripe.Refund['status']) {
  if (status === 'succeeded') return REFUND_STATES.SUCCEEDED;
  return status === 'failed' || status === 'canceled' || status === 'requires_action'
    ? REFUND_STATES.FAILED
    : REFUND_STATES.PENDING;
}
