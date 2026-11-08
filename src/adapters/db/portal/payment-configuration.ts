import { eq } from 'drizzle-orm';
import { organizations } from '../schema';
import type { Executor } from '../transaction';
import { PAYMENT_MODES, ERROR_CODES, type PaymentMode } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
export async function paymentConfiguration(db: Executor, id: string, mode: PaymentMode) {
  const [org] = await db.select().from(organizations).where(eq(organizations.id, id));
  if (!org) return failure(ERROR_CODES.NOT_FOUND, 'Organization', 'payment');
  if (
    mode === PAYMENT_MODES.STRIPE &&
    (!org.stripeReady || (!org.merchantAccountId && !org.usesPlatformPayments))
  )
    return failure(ERROR_CODES.STRIPE_ACCOUNT_REQUIRED, 'Organization', 'payment');
  if (mode === PAYMENT_MODES.BANK_TRANSFER && (!org.bankIban || !org.bankAccountName))
    return failure(ERROR_CODES.BANK_DETAILS_REQUIRED, 'Organization', 'payment');
  return ok(undefined);
}
