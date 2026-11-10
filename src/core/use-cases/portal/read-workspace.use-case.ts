import { z } from 'zod';
import { SessionDetailsSchema } from '../../validation/session-details';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { PortalRepositoryPort } from '../../ports/portal-repository.port';
import { BookingFilterSchema } from '../../validation/portal-organization';
import { withPortalActor } from './actor';
const FilterSchema = z.object({ organizationId: z.uuid(), filter: BookingFilterSchema });
export class ReadWorkspaceUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: PortalRepositoryPort,
  ) {}
  overview(raw: unknown) {
    return withPortalActor(this.identity, 'Workspace', async (actor) => {
      const id = z.uuid().safeParse(raw);
      return id.success
        ? this.repository.overview(actor, id.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Workspace', 'overview');
    });
  }
  sessionDetails(raw: unknown) {
    return withPortalActor(this.identity, 'SessionDetails', async (actor) => {
      const input = SessionDetailsSchema.safeParse(raw);
      return input.success
        ? this.repository.sessionDetails(actor, input.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Session', 'details');
    });
  }
  bookings(raw: unknown) {
    return withPortalActor(this.identity, 'Bookings', async (actor) => {
      const parsed = FilterSchema.safeParse(raw);
      return parsed.success
        ? this.repository.bookings(actor, parsed.data.organizationId, parsed.data.filter)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Bookings', 'list');
    });
  }
}
