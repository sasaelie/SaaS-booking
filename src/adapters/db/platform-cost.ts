import { eq } from 'drizzle-orm';
import { financialPayments, platformCosts } from './schema';
import { platformAudit } from './schema/saas';
import type { Transaction } from './transaction';
import { requireOperator } from './portal/authorization';
import type { PortalActor } from '../../core/ports/portal-models';
import type { PlatformCostInput } from '../../core/validation/commercial';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
import { ERROR_CODES } from '../../config/constants';
export async function recordPlatformCost(
  tx: Transaction,
  actor: PortalActor,
  input: PlatformCostInput,
) {
  await requireOperator(tx, actor);
  const [alreadyIncluded] = await tx
    .select({ id: financialPayments.id })
    .from(financialPayments)
    .where(eq(financialPayments.balanceTransactionId, input.sourceReference));
  if (alreadyIncluded)
    return failure(ERROR_CODES.CONFLICT, 'PlatformCost', 'already-in-processing-fees');
  const inserted = await tx
    .insert(platformCosts)
    .values({ ...input, occurredAt: new Date(input.occurredAt) })
    .onConflictDoNothing()
    .returning();
  if (inserted.length)
    await tx.insert(platformAudit).values({
      organizationId: input.organizationId,
      actorUserId: actor.id,
      action: 'PLATFORM_COST_RECORDED',
    });
  return ok(undefined);
}
