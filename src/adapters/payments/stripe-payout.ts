import type Stripe from 'stripe';
import { z } from 'zod';
import type { FinancialPayoutInput, ReconciledPayout } from '../../core/ports/financial.port';
import { ok, type Result } from '../../lib/result';
import { failure } from '../../lib/errors';
import { ERROR_CODES, SAAS } from '../../config/constants';
const PaymentSchema = z.object({
  payment_intent: z
    .union([z.string(), z.object({ id: z.string() })])
    .nullable()
    .optional(),
  source_transfer: z
    .object({ source_transaction: z.object({ payment_intent: z.string() }).optional() })
    .nullable()
    .optional(),
});
export async function reconcileStripePayout(
  stripe: Stripe,
  input: FinancialPayoutInput,
): Promise<Result<ReconciledPayout>> {
  try {
    const options = { stripeAccount: input.merchantAccountId };
    const payout = await stripe.payouts.retrieve(input.payoutId, {}, options);
    if (payout.currency !== 'eur' || payout.status !== 'paid')
      return failure(ERROR_CODES.CONFLICT, 'FinancialPayout', 'pending');
    if (!payout.automatic) return ok({ status: 'MANUAL_UNALLOCATED', paymentReferences: [] });
    const references: string[] = [];
    for await (const transaction of stripe.balanceTransactions.list(
      {
        payout: payout.id,
        limit: SAAS.PAGE_SIZE,
        expand: ['data.source.source_transfer.source_transaction'],
      },
      options,
    )) {
      const source = PaymentSchema.safeParse(transaction.source);
      if (!source.success) continue;
      const direct = source.data.payment_intent;
      const reference =
        typeof direct === 'string'
          ? direct
          : (direct?.id ?? source.data.source_transfer?.source_transaction?.payment_intent);
      if (reference) references.push(reference);
    }
    return ok({ status: payout.status, paymentReferences: [...new Set(references)] });
  } catch {
    return failure(ERROR_CODES.PAYMENT_PROVIDER_ERROR, 'FinancialPayout', 'retrieve');
  }
}
