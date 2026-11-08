import { z } from 'zod';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { PortalRepositoryPort } from '../../ports/portal-repository.port';
import { CreateOrganizationSchema, SettingsSchema } from '../../validation/portal-organization';
import { withPortalActor } from './actor';
export class OrganizationsUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: PortalRepositoryPort,
  ) {}
  list() {
    return withPortalActor(this.identity, 'Organizations', (actor) =>
      this.repository.listOrganizations(actor),
    );
  }
  get(raw: unknown) {
    return withPortalActor(this.identity, 'Organization', async (actor) => {
      const id = z.uuid().safeParse(raw);
      return id.success
        ? this.repository.getOrganization(actor, id.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Organization', 'get');
    });
  }
  create(raw: unknown) {
    return withPortalActor(this.identity, 'Organization', async (actor) => {
      const parsed = CreateOrganizationSchema.safeParse(raw);
      return parsed.success
        ? this.repository.createOrganization(actor, parsed.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Organization', 'create');
    });
  }
  settings(raw: unknown) {
    return withPortalActor(this.identity, 'Organization', async (actor) => {
      const parsed = SettingsSchema.safeParse(raw);
      return parsed.success
        ? this.repository.updateSettings(actor, parsed.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Organization', 'settings');
    });
  }
}
