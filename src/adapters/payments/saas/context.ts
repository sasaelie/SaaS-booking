import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';
import type { DrizzlePgDb } from '../../db/client';
import type { PortalActor } from '../../../core/ports/portal-models';
import { organizationAccess } from '../../db/schema/saas';
import { requireMembership } from '../../db/portal/authorization';
import { atomic } from '../../db/transaction';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
export interface BillingSettings {
  readonly stripe: Stripe;
  readonly priceId: string;
  readonly appUrl: string;
}
export interface BillingContext extends BillingSettings {
  readonly db: DrizzlePgDb;
  readonly actor: PortalActor;
  readonly organizationId: string;
}
export function ownerAccess(context: BillingContext) {
  return atomic(context.db, 'Subscription', async (tx) => {
    await requireMembership(tx, context.actor, context.organizationId, true);
    const [access] = await tx
      .select()
      .from(organizationAccess)
      .where(eq(organizationAccess.organizationId, context.organizationId));
    return access ? ok(access) : failure(ERROR_CODES.NOT_FOUND, 'Subscription', 'organization');
  });
}
export type BillingAccess = typeof organizationAccess.$inferSelect;
export function billingReturn(context: Pick<BillingContext, 'appUrl' | 'organizationId'>) {
  return `${context.appUrl}/app/${context.organizationId}/abonnement`;
}
