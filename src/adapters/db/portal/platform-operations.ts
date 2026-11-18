import { and, asc, desc, eq, gt, isNull, sql, type SQL } from 'drizzle-orm';
import { outboxJobs, organizations } from '../schema';
import { requireOperator } from './authorization';
import { platformSearch } from './platform-filters';
import type { Transaction } from '../transaction';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { PlatformFilter } from '../../../core/ports/portal-inputs';
import { SAAS } from '../../../config/constants';
import { ok } from '../../../lib/result';
const fields = {
  id: outboxJobs.id,
  organizationId: outboxJobs.organizationId,
  organizationName: organizations.name,
  type: outboxJobs.type,
  attempts: outboxJobs.attempts,
  lastError: outboxJobs.lastError,
  availableAt: outboxJobs.availableAt,
  createdAt: outboxJobs.createdAt,
};
export async function platformOperations(
  tx: Transaction,
  actor: PortalActor,
  filter: PlatformFilter,
) {
  await requireOperator(tx, actor);
  const base = and(
    isNull(outboxJobs.completedAt),
    platformSearch(filter.search),
    filter.type ? eq(outboxJobs.type, filter.type) : undefined,
  );
  const status =
    filter.status === 'RETRY'
      ? gt(outboxJobs.attempts, 0)
      : filter.status === 'PENDING'
        ? eq(outboxJobs.attempts, 0)
        : undefined;
  const where = and(base, status);
  const [counts] = await operationCounts(tx, base, status);
  const total = counts?.total ?? 0;
  const size = filter.pageSize ?? SAAS.PAGE_SIZE;
  const page = Math.min(filter.page, Math.max(1, Math.ceil(total / size)));
  const entries = await tx
    .select(fields)
    .from(outboxJobs)
    .innerJoin(organizations, eq(organizations.id, outboxJobs.organizationId))
    .where(where)
    .orderBy(...order(filter.sort))
    .limit(size)
    .offset((page - 1) * size);
  return ok({
    entries,
    total,
    failedCount: counts?.failedCount ?? 0,
    pendingCount: counts?.pendingCount ?? 0,
    page,
    pageSize: size,
  });
}
function operationCounts(tx: Transaction, base: SQL | undefined, status: SQL | undefined) {
  return tx
    .select({
      total: sql<number>`count(*) FILTER(WHERE ${status ?? sql`true`})::int`,
      failedCount: sql<number>`count(*) FILTER(WHERE ${gt(outboxJobs.attempts, 0)})::int`,
      pendingCount: sql<number>`count(*)::int`,
    })
    .from(outboxJobs)
    .innerJoin(organizations, eq(organizations.id, outboxJobs.organizationId))
    .where(base);
}
function order(sort?: string) {
  if (sort === 'oldest') return [asc(outboxJobs.createdAt), asc(outboxJobs.id)];
  if (sort === 'newest') return [desc(outboxJobs.createdAt), desc(outboxJobs.id)];
  return [desc(outboxJobs.attempts), asc(outboxJobs.createdAt), asc(outboxJobs.id)];
}
