import { z } from 'zod';
import { and, eq, inArray } from 'drizzle-orm';
import { financialPayments, organizations } from '../db/schema';
import { atomic } from '../db/transaction';
import type { DrizzlePgDb } from '../db/client';
import type { PaymentGatewayPort } from '../../core/ports/payment-gateway.port';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
import { ERROR_CODES } from '../../config/constants';
const PayoutSchema = z.object({
  organizationId: z.uuid(),
  merchantAccountId: z.string().startsWith('acct_'),
  payoutId: z.string().startsWith('po_'),
});
export async function reconcilePayout(db: DrizzlePgDb, gateway: PaymentGatewayPort, raw: unknown) {
  const input = PayoutSchema.parse(raw);
  const [organization] = await db
    .select()
    .from(organizations)
    .where(
      and(
        eq(organizations.id, input.organizationId),
        eq(organizations.merchantAccountId, input.merchantAccountId),
      ),
    );
  if (!organization || !gateway.reconcilePayout)
    return failure(ERROR_CODES.CONFIGURATION_ERROR, 'FinancialPayout', 'scope');
  const result = await gateway.reconcilePayout(input);
  if (!result.ok) return result;
  return atomic(db, 'FinancialPayout', async (tx) => {
    if (result.value.paymentReferences.length)
      await tx
        .update(financialPayments)
        .set({ payoutId: input.payoutId, payoutStatus: result.value.status })
        .where(
          and(
            eq(financialPayments.organizationId, input.organizationId),
            eq(financialPayments.merchantAccountId, input.merchantAccountId),
            inArray(financialPayments.paymentReference, [...result.value.paymentReferences]),
          ),
        );
    return ok({});
  });
}
