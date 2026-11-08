import { asc, eq, sql, type SQL } from 'drizzle-orm';
import { organizations } from '../schema';
import { organizationAccess } from '../schema/saas';
import type { Transaction } from '../transaction';
import { SAAS } from '../../../config/constants';
export function platformOrganizationRows(tx: Transaction, search: SQL | undefined, page: number) {
  return tx
    .select({
      organization: organizations,
      access: organizationAccess,
      ownerEmail: sql<
        string | null
      >`(SELECT u.email FROM organization_members m JOIN "user" u ON u.id=m.user_id WHERE m.organization_id=${organizations.id} AND m.role='OWNER' LIMIT 1)`,
      activityCount: sql<number>`(SELECT count(*)::int FROM activities a WHERE a.organization_id=${organizations.id})`,
      bookingCount: sql<number>`(SELECT count(*)::int FROM bookings b WHERE b.organization_id=${organizations.id})`,
    })
    .from(organizations)
    .innerJoin(organizationAccess, eq(organizationAccess.organizationId, organizations.id))
    .where(search)
    .orderBy(asc(organizations.name))
    .limit(SAAS.PAGE_SIZE)
    .offset((page - 1) * SAAS.PAGE_SIZE);
}
export async function platformCounts(tx: Transaction, search: SQL | undefined) {
  const [counts] = await tx
    .select({
      total: sql<number>`count(*)::int`,
      activeCount: sql<number>`count(*) FILTER(WHERE NOT ${organizationAccess.complimentary} AND ${organizationAccess.suspendedAt} IS NULL AND ${organizationAccess.status}='ACTIVE' AND ${organizationAccess.currentPeriodEnd}>now())::int`,
      complimentaryCount: sql<number>`count(*) FILTER(WHERE ${organizationAccess.complimentary})::int`,
      pastDueCount: sql<number>`count(*) FILTER(WHERE ${organizationAccess.status}='PAST_DUE')::int`,
      deferredJobs: sql<number>`(SELECT count(*)::int FROM outbox_jobs WHERE completed_at IS NULL AND attempts>0)`,
    })
    .from(organizations)
    .innerJoin(organizationAccess, eq(organizationAccess.organizationId, organizations.id))
    .where(search);
  return counts;
}
