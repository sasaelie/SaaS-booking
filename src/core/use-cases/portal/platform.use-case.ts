import { z } from 'zod';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { PortalRepositoryPort } from '../../ports/portal-repository.port';
import { PlatformFilterSchema } from '../../validation/portal-organization';
import { withPortalActor } from './actor';
const GrantSchema = z.object({ organizationId: z.uuid(), complimentary: z.boolean() });
const SuspendSchema = z.object({ organizationId: z.uuid(), suspended: z.boolean() });
export class PlatformUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: PortalRepositoryPort,
  ) {}
  permitted() {
    return withPortalActor(this.identity, 'Platform', (actor) =>
      this.repository.isPlatformOperator(actor),
    );
  }
  overview(raw: unknown) {
    return withPortalActor(this.identity, 'Platform', async (actor) => {
      const parsed = PlatformFilterSchema.safeParse(raw);
      return parsed.success
        ? this.repository.platform(actor, parsed.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Platform', 'list');
    });
  }
  grant(raw: unknown) {
    return withPortalActor(this.identity, 'Platform', async (actor) => {
      const parsed = GrantSchema.safeParse(raw);
      return parsed.success
        ? this.repository.grantAccess(actor, parsed.data.organizationId, parsed.data.complimentary)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Platform', 'grant');
    });
  }
  suspend(raw: unknown) {
    return withPortalActor(this.identity, 'Platform', async (actor) => {
      const parsed = SuspendSchema.safeParse(raw);
      return parsed.success
        ? this.repository.suspend(actor, parsed.data.organizationId, parsed.data.suspended)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Platform', 'suspend');
    });
  }
}
