import { and, asc, desc, ilike, or, sql } from 'drizzle-orm';
import { organizations } from '../schema';
import { organizationAccess } from '../schema/saas';
import type { PlatformFilter } from '../../../core/ports/portal-inputs';
export function platformSearch(search: string) {
  if (!search) return undefined;
  const pattern = `%${search.replace(/[\\%_]/g, '\\$&')}%`;
  return or(
    ilike(organizations.name, pattern),
    ilike(organizations.slug, pattern),
    sql`EXISTS(SELECT 1 FROM organization_members m JOIN "user" u ON u.id=m.user_id WHERE m.organization_id=${organizations.id} AND m.role='OWNER' AND u.email ILIKE ${pattern})`,
  );
}
export function platformWhere(filter: PlatformFilter) {
  const access = organizationAccess;
  const pro = sql`(${access.complimentary} OR ${access.graceUntil}>now() OR (${access.status}='ACTIVE' AND ${access.currentPeriodEnd}>now()))`;
  const states = {
    ACTIVE: sql`NOT ${access.complimentary} AND ${access.status}='ACTIVE' AND ${access.currentPeriodEnd}>now()`,
    COMPLIMENTARY: sql`${access.complimentary}`,
    SUSPENDED: sql`${access.suspendedAt} IS NOT NULL`,
    PAST_DUE: sql`${access.status}='PAST_DUE'`,
    EXPIRED: sql`NOT COALESCE((${pro}),false) AND ${access.suspendedAt} IS NULL AND ${access.status}<>'PAST_DUE' AND (${access.currentPeriodEnd} IS NOT NULL OR ${access.status}='CANCELED')`,
    INACTIVE: sql`NOT COALESCE((${pro}),false) AND ${access.suspendedAt} IS NULL AND ${access.currentPeriodEnd} IS NULL AND ${access.status} NOT IN ('CANCELED','PAST_DUE')`,
  };
  const status =
    filter.status && filter.status in states
      ? states[filter.status as keyof typeof states]
      : undefined;
  return and(
    platformSearch(filter.search),
    status,
    filter.plan
      ? filter.plan === 'PRO'
        ? sql`COALESCE((${pro}),false)`
        : sql`NOT COALESCE((${pro}),false)`
      : undefined,
  );
}
export function platformOrderBy(sort?: string) {
  if (sort === 'newest') return [desc(organizations.createdAt), desc(organizations.id)];
  if (sort === 'oldest') return [asc(organizations.createdAt), asc(organizations.id)];
  if (sort === 'expiry')
    return [sql`${organizationAccess.currentPeriodEnd} ASC NULLS LAST`, asc(organizations.id)];
  return [asc(organizations.name), asc(organizations.id)];
}
