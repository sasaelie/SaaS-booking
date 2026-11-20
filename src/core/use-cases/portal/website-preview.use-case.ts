import type { WebsitePreviewAccessPorts } from '../../ports/website-preview';
import { WebsitePreviewSlugSchema } from '../../validation/website-preview';
import { WEBSITE_PREVIEW as W } from '../../../config/website-preview';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { guardUseCase } from '../../../lib/guard-use-case';
import { ok } from '../../../lib/result';
export class WebsitePreviewAccessUseCase {
  constructor(
    private readonly ports: WebsitePreviewAccessPorts,
    private readonly staging: boolean,
  ) {}
  execute(raw: unknown) {
    return guardUseCase('WebsitePreview', 'access', async () => {
      const slug = WebsitePreviewSlugSchema.safeParse(raw);
      if (!this.staging || !slug.success)
        return failure(ERROR_CODES.NOT_FOUND, 'WebsitePreview', 'disabled');
      const security = await this.ports.security.read();
      if (!security.ok) return security;
      if (security.value.enabled && !security.value.verified)
        return failure(ERROR_CODES.MFA_REQUIRED, 'WebsitePreview', 'verification');
      const catalog = await this.ports.catalog.execute(slug.data);
      if (!catalog.ok) return catalog;
      if (catalog.value.showPlatformSignature !== false)
        return failure(ERROR_CODES.SUBSCRIPTION_REQUIRED, 'WebsitePreview', 'entitlement');
      const organization = await this.ports.organizations.get(catalog.value.organizationId);
      if (!organization.ok) return organization;
      if (organization.value.role !== W.OWNER)
        return failure(ERROR_CODES.UNAUTHORIZED, 'WebsitePreview', 'owner');
      return ok({ organizationId: organization.value.id, slug: slug.data });
    });
  }
}
