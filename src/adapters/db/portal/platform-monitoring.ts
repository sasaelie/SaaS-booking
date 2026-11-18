import { asc, desc, eq, sql, type SQL } from 'drizzle-orm';
import { organizations } from '../schema';
import { platformAudit } from '../schema/saas';
import { requireOperator } from './authorization';
import { platformSearch } from './platform-filters';
import type { Transaction } from '../transaction';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { PlatformFilter } from '../../../core/ports/portal-inputs';
import { SAAS } from '../../../config/constants';
import { ok } from '../../../lib/result';
export async function platformHistory(tx: Transaction, actor: PortalActor, filter: PlatformFilter) {
  await requireOperator(tx, actor);
  const where = platformSearch(filter.search);
  const [counts] = await tx
    .select({ total: sql<number>`count(*)::int` })
    .from(platformAudit)
    .leftJoin(organizations, eq(organizations.id, platformAudit.organizationId))
    .where(where);
  const total = counts?.total ?? 0;
  const size = filter.pageSize ?? SAAS.PAGE_SIZE;
  const page = Math.min(filter.page, Math.max(1, Math.ceil(total / size)));
  return ok({
    entries: await historyEntries(tx, where, filter, page),
    total,
    page,
    pageSize: size,
  });
}
function historyEntries(
  tx: Transaction,
  where: SQL | undefined,
  filter: PlatformFilter,
  page: number,
) {
  return tx
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
    .orderBy(
      filter.sort === 'oldest' ? asc(platformAudit.createdAt) : desc(platformAudit.createdAt),
      desc(platformAudit.id),
    )
    .limit(filter.pageSize ?? SAAS.PAGE_SIZE)
    .offset((page - 1) * (filter.pageSize ?? SAAS.PAGE_SIZE));
}
