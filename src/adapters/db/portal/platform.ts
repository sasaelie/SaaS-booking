import { eq, ilike, or, sql } from 'drizzle-orm';
import { organizations } from '../schema';
import { organizationAccess, platformAudit } from '../schema/saas';
import { rows, type Transaction } from '../transaction';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { PlatformFilter } from '../../../core/ports/portal-inputs';
import { requireOperator } from './authorization';
import { ok } from '../../../lib/result';
import { failure } from '../../../lib/errors';
import { ERROR_CODES } from '../../../config/constants';
import { platformOrganizationRows, platformCounts } from './platform-data';
import { platformFinance } from '../platform-finance';
export async function platformOverview(
  tx: Transaction,
  actor: PortalActor,
  filter: PlatformFilter,
) {
  await requireOperator(tx, actor);
  const search = filter.search
    ? or(
        ilike(organizations.name, `%${filter.search}%`),
        ilike(organizations.slug, `%${filter.search}%`),
      )
    : undefined;
  const list = await platformOrganizationRows(tx, search, filter.page);
  const counts = await platformCounts(tx, search);
  return ok({
    financial: await platformFinance(tx),
    organizations: list.map(({ organization, access, ...other }) => ({
      ...organization,
      access,
      ...other,
    })),
    total: counts?.total ?? 0,
    activeCount: counts?.activeCount ?? 0,
    complimentaryCount: counts?.complimentaryCount ?? 0,
    pastDueCount: counts?.pastDueCount ?? 0,
    deferredJobs: counts?.deferredJobs ?? 0,
  });
}
export async function setPlatformAccess(
  tx: Transaction,
  actor: PortalActor,
  id: string,
  values: { complimentary: boolean } | { suspendedAt: Date | null },
) {
  await requireOperator(tx, actor);
  const [lock] = await rows<{ locked: boolean }>(
    tx,
    sql`SELECT pg_try_advisory_xact_lock(hashtextextended(${`billing:${id}`},0)) AS locked`,
  );
  if (!lock?.locked) return failure(ERROR_CODES.CONFLICT, 'Platform', 'billing-busy');
  const [access] = await tx
    .select()
    .from(organizationAccess)
    .where(eq(organizationAccess.organizationId, id))
    .for('update');
  if (!access) return failure(ERROR_CODES.NOT_FOUND, 'Platform', 'access');
  if ('complimentary' in values && values.complimentary && access.stripeCustomerId)
    return failure(ERROR_CODES.CONFLICT, 'Platform', 'paid-subscription');
  await tx
    .update(organizationAccess)
    .set({
      ...values,
      updatedAt: new Date(),
      ...('complimentary' in values && !access.libertySelectionManual
        ? { libertySelectionAt: null }
        : {}),
    })
    .where(eq(organizationAccess.organizationId, id));
  const action = accessAction(values);
  await tx.insert(platformAudit).values({ organizationId: id, actorUserId: actor.id, action });
  return ok(undefined);
}

function accessAction(values: { complimentary: boolean } | { suspendedAt: Date | null }) {
  return 'complimentary' in values
    ? values.complimentary
      ? 'ACCESS_GRANTED'
      : 'ACCESS_REVOKED'
    : values.suspendedAt
      ? 'SUSPENDED'
      : 'RESTORED';
}
