import { and, eq, asc } from 'drizzle-orm';
import type { PublicCatalogPort } from '../../core/ports/public-catalog.port';
import type { DrizzlePgDb } from './client';
import { atomic } from './transaction';
import { organizations, activities } from './schema';
import { organizationBranding } from './schema/saas';
import { ok } from '../../lib/result';
import { failure } from '../../lib/errors';
import { ERROR_CODES } from '../../config/constants';
export class DrizzlePublicCatalogRepository implements PublicCatalogPort {
  constructor(private readonly db: DrizzlePgDb) {}
  find(slug: string) {
    return atomic(this.db, 'Catalog', async (tx) => {
      const [organization] = await tx
        .select({
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
          branding: organizationBranding,
        })
        .from(organizations)
        .leftJoin(organizationBranding, eq(organizationBranding.organizationId, organizations.id))
        .where(eq(organizations.slug, slug));
      if (!organization) return failure(ERROR_CODES.NOT_FOUND, 'Catalog', 'find');
      const list = await tx
        .select({
          id: activities.id,
          name: activities.name,
          description: activities.description,
          priceCents: activities.priceCents,
          currency: activities.currency,
          audiencePolicy: activities.audiencePolicy,
        })
        .from(activities)
        .where(and(eq(activities.organizationId, organization.id), eq(activities.isActive, true)))
        .orderBy(asc(activities.name));
      return ok({
        organizationId: organization.id,
        name: organization.name,
        slug: organization.slug,
        theme: organization.branding?.theme ?? 'SAGE',
        hasLogo: Boolean(organization.branding?.logoStorageKey),
        activities: list,
      });
    });
  }
}
