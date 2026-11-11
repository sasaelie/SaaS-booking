import { and, eq, inArray, sql } from 'drizzle-orm';
import type { FinancialRepositoryPort, FinancialSummary } from '../../core/ports/financial.port';
import type { PortalActor } from '../../core/ports/portal-models';
import type { DrizzlePgDb } from './client';
import { atomic } from './transaction';
import { requireMembership } from './portal/authorization';
import { requireCommercialAccess } from './portal/access';
import { requirePro } from './commercial-access';
import { activities, financialPayments } from './schema';
import { organizationAccess } from './schema/saas';
import { COMMERCIAL } from '../../config/commercial';
import { TIME, ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
import { financialCsv } from './financial-export';
import { recordPlatformCost } from './platform-cost';
import type { PlatformCostInput } from '../../core/validation/commercial';
export class DrizzleFinancialRepository implements FinancialRepositoryPort {
  recordCost(actor: PortalActor, input: PlatformCostInput) {
    return atomic(this.db, 'PlatformCost', (tx) => recordPlatformCost(tx, actor, input));
  }
  constructor(private readonly db: DrizzlePgDb) {}
  summary(actor: PortalActor, id: string) {
    return atomic(this.db, 'Financial', async (tx) => {
      await requireMembership(tx, actor, id);
      const since = new Date(Date.now() - COMMERCIAL.LOOKBACK_DAYS * TIME.DAY_MS);
      const [totals] = await tx
        .select({
          commissionCents: sql<number>`COALESCE(sum(commission_cents-commission_refunded_cents) FILTER(WHERE status='RECONCILED' AND commercial_plan='LIBERTE'),0)::int`,
          stripeFeeCents: sql<number>`COALESCE(sum(stripe_fee_cents) FILTER(WHERE status='RECONCILED' AND commercial_plan='LIBERTE'),0)::int`,
          pendingCount: sql<number>`count(*) FILTER(WHERE status='PENDING')::int`,
          reconciledCount: sql<number>`count(*) FILTER(WHERE status='RECONCILED')::int`,
        })
        .from(financialPayments)
        .where(and(eq(financialPayments.organizationId, id), sql`paid_at>=${since}`));
      const value = totals ?? {
        commissionCents: 0,
        stripeFeeCents: 0,
        pendingCount: 0,
        reconciledCount: 0,
      };
      return ok<FinancialSummary>({
        ...value,
        avoidableCents: value.commissionCents - value.stripeFeeCents,
      });
    });
  }
  export(actor: PortalActor, id: string) {
    return atomic(
      this.db,
      'FinancialExport',
      async (tx) => {
        await requireMembership(tx, actor, id);
        await requirePro(tx, id);
        return ok(await financialCsv(tx, id));
      },
      { isolationLevel: 'repeatable read' },
    );
  }
  selectActivities(actor: PortalActor, id: string, ids: readonly string[]) {
    return atomic(this.db, 'CommercialSelection', async (tx) => {
      await requireMembership(tx, actor, id, true);
      await requireCommercialAccess(tx, id, new Date());
      const list = ids.length
        ? await tx
            .select({ id: activities.id })
            .from(activities)
            .where(
              and(
                eq(activities.organizationId, id),
                eq(activities.isActive, true),
                inArray(activities.id, [...ids]),
              ),
            )
        : [];
      if (
        ids.length > COMMERCIAL.LIBERTE_ACTIVITY_LIMIT ||
        new Set(ids).size !== ids.length ||
        list.length !== ids.length
      )
        return failure(ERROR_CODES.VALIDATION_FAILED, 'Commercial', 'selection');
      await tx
        .update(organizationAccess)
        .set({
          libertyActivityIds: [...ids],
          libertySelectionAt: new Date(),
          libertySelectionManual: true,
        })
        .where(eq(organizationAccess.organizationId, id));
      return ok(undefined);
    });
  }
}
