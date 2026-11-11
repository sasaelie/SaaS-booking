import { initializeCommercialSelection } from '../commercial-access';
import { and, eq, sql } from 'drizzle-orm';
import { organizations } from '../schema';
import { organizationAccess, organizationMembers, organizationBranding } from '../schema/saas';
import { rows, type Transaction, type Executor, required } from '../transaction';
import { ok } from '../../../lib/result';
import { failure } from '../../../lib/errors';
import { ERROR_CODES, MEMBER_ROLES, SAAS } from '../../../config/constants';
import type { PortalActor, OrganizationSummary } from '../../../core/ports/portal-models';
import type { CreateOrganizationInput } from '../../../core/ports/portal-inputs';
function organizationQuery(db: Executor, actor: PortalActor) {
  return db
    .select({
      organization: organizations,
      access: organizationAccess,
      branding: organizationBranding,
      role: organizationMembers.role,
    })
    .from(organizations)
    .innerJoin(
      organizationMembers,
      and(
        eq(organizationMembers.organizationId, organizations.id),
        eq(organizationMembers.userId, actor.id),
      ),
    )
    .innerJoin(organizationAccess, eq(organizationAccess.organizationId, organizations.id))
    .leftJoin(organizationBranding, eq(organizationBranding.organizationId, organizations.id));
}
function toOrganization(
  row: Awaited<ReturnType<typeof organizationQuery>>[number],
): OrganizationSummary {
  return {
    ...row.organization,
    role: row.role,
    access: row.access,
    organizerHue: row.branding?.organizerHue ?? null,
    participantHue: row.branding?.participantHue ?? null,
    storyTextTone: row.branding?.storyTextTone ?? 'WHITE',
    theme: row.branding?.theme ?? 'SAGE',
    hasLogo: Boolean(row.branding?.logoStorageKey),
    hasBackground: Boolean(row.branding?.backgroundStorageKey),
  };
}
export async function listOrganizations(db: Executor, actor: PortalActor) {
  return ok(
    (await organizationQuery(db, actor).orderBy(organizations.createdAt)).map(toOrganization),
  );
}
export async function getOrganization(db: Executor, actor: PortalActor, id: string) {
  const [row] = await organizationQuery(db, actor).where(eq(organizations.id, id));
  if (!row) return failure(ERROR_CODES.NOT_FOUND, 'Organization', 'get');
  const state = await initializeCommercialSelection(db, id);
  return ok(
    toOrganization({ ...row, access: { ...row.access, libertyActivityIds: state.selected } }),
  );
}
export async function createOrganization(
  tx: Transaction,
  actor: PortalActor,
  input: CreateOrganizationInput,
) {
  await rows(tx, sql`SELECT pg_advisory_xact_lock(hashtextextended(${actor.id},0))`);
  const [count] = await rows<{ count: number }>(
    tx,
    sql`SELECT count(*)::int AS count FROM organization_members WHERE user_id=${actor.id}`,
  );
  if ((count?.count ?? 0) >= SAAS.MAX_MEMBERSHIPS)
    return failure(ERROR_CODES.CONFLICT, 'Organization', 'limit');
  const [organization] = await tx
    .insert(organizations)
    .values(input)
    .onConflictDoNothing({ target: organizations.slug })
    .returning({ id: organizations.id });
  if (!organization) return failure(ERROR_CODES.SLUG_UNAVAILABLE, 'Organization', 'slug');
  await tx
    .insert(organizationMembers)
    .values({ organizationId: organization.id, userId: actor.id, role: MEMBER_ROLES.OWNER });
  await tx.insert(organizationAccess).values({ organizationId: organization.id });
  await tx.insert(organizationBranding).values({ organizationId: organization.id });
  required(await getOrganization(tx, actor, organization.id));
  return ok({ organizationId: organization.id });
}
