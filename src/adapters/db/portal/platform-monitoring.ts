import { and, desc, eq, gt, ilike, isNull, or, sql } from 'drizzle-orm';
import { outboxJobs, organizations } from '../schema';
import { platformAudit } from '../schema/saas';
import { requireOperator } from './authorization';
import type { Transaction } from '../transaction';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { PlatformFilter } from '../../../core/ports/portal-inputs';
import { SAAS } from '../../../config/constants';
import { ok } from '../../../lib/result';
function organizationSearch(search: string) {
  return search
    ? or(ilike(organizations.name, `%${search}%`), ilike(organizations.slug, `%${search}%`))
    : undefined;
}
export async function platformOperations(
  tx: Transaction,
  actor: PortalActor,
  filter: PlatformFilter,
) {
  await requireOperator(tx, actor);
  const where = and(isNull(outboxJobs.completedAt), organizationSearch(filter.search));
  const entries = await tx
    .select({
      id: outboxJobs.id,
      organizationId: outboxJobs.organizationId,
      organizationName: organizations.name,
      type: outboxJobs.type,
      attempts: outboxJobs.attempts,
      lastError: outboxJobs.lastError,
      availableAt: outboxJobs.availableAt,
      createdAt: outboxJobs.createdAt,
    })
    .from(outboxJobs)
    .innerJoin(organizations, eq(organizations.id, outboxJobs.organizationId))
    .where(where)
    .orderBy(desc(outboxJobs.attempts), desc(outboxJobs.createdAt), desc(outboxJobs.id))
    .limit(SAAS.PAGE_SIZE)
    .offset((filter.page - 1) * SAAS.PAGE_SIZE);
  const [counts] = await tx
    .select({
      total: sql<number>`count(*)::int`,
      failedCount: sql<number>`count(*) FILTER(WHERE ${gt(outboxJobs.attempts, 0)})::int`,
    })
    .from(outboxJobs)
    .innerJoin(organizations, eq(organizations.id, outboxJobs.organizationId))
    .where(where);
  return ok({
    entries,
    total: counts?.total ?? 0,
    failedCount: counts?.failedCount ?? 0,
    page: filter.page,
  });
}
export async function platformHistory(tx: Transaction, actor: PortalActor, filter: PlatformFilter) {
  await requireOperator(tx, actor);
  const where = organizationSearch(filter.search);
  const entries = await tx
    .select({
      id: platformAudit.id,
      organizationId: platformAudit.organizationId,
      organizationName: organizations.name,
      actorName: sql<
        string | null
      >`(SELECT u.name FROM "user" u WHERE u.id=${platformAudit.actorUserId})`,
      action: platformAudit.action,
      createdAt: platformAudit.createdAt,
    })
    .from(platformAudit)
    .leftJoin(organizations, eq(organizations.id, platformAudit.organizationId))
    .where(where)
    .orderBy(desc(platformAudit.createdAt), desc(platformAudit.id))
    .limit(SAAS.PAGE_SIZE)
    .offset((filter.page - 1) * SAAS.PAGE_SIZE);
  const [counts] = await tx
    .select({ total: sql<number>`count(*)::int` })
    .from(platformAudit)
    .leftJoin(organizations, eq(organizations.id, platformAudit.organizationId))
    .where(where);
  return ok({ entries, total: counts?.total ?? 0, page: filter.page });
}
