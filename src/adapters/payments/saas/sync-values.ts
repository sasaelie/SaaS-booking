import { eq } from 'drizzle-orm';
import { organizationAccess } from '../../db/schema/saas';
import type { Transaction } from '../../db/transaction';
import { ERROR_CODES, ACCESS_STATUSES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
type Values = Pick<
  typeof organizationAccess.$inferSelect,
  | 'stripeCustomerId'
  | 'stripeSubscriptionId'
  | 'status'
  | 'currentPeriodEnd'
  | 'cancelAtPeriodEnd'
  | 'updatedAt'
>;
export async function syncValues(tx: Transaction, id: string, values: Values) {
  const [access] = await tx
    .select()
    .from(organizationAccess)
    .where(eq(organizationAccess.organizationId, id))
    .for('update');
  if (!access || access.stripeCustomerId !== values.stripeCustomerId)
    return failure(ERROR_CODES.UNAUTHORIZED, 'Subscription', 'customer');
  if (
    access.stripeSubscriptionId &&
    access.stripeSubscriptionId !== values.stripeSubscriptionId &&
    access.status === ACCESS_STATUSES.ACTIVE &&
    access.currentPeriodEnd !== null &&
    access.currentPeriodEnd.getTime() > Date.now()
  )
    return ok(undefined);
  await tx.update(organizationAccess).set(values).where(eq(organizationAccess.organizationId, id));
  return ok(undefined);
}
