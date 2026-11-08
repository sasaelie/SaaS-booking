import { z } from 'zod';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { PortalRepositoryPort } from '../../ports/portal-repository.port';
import { CreateActivitySchema } from '../../validation/portal-activity';
import { withPortalActor } from './actor';
import { activitySchedule } from './activity-schedule';
const ArchiveSchema = z.object({ organizationId: z.uuid(), activityId: z.uuid() });
export class ActivitiesUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: PortalRepositoryPort,
  ) {}
  create(raw: unknown) {
    return withPortalActor(this.identity, 'Activities', async (actor) => {
      const parsed = CreateActivitySchema.safeParse(raw);
      if (!parsed.success) return failure(ERROR_CODES.VALIDATION_FAILED, 'Activities', 'create');
      const organization = await this.repository.getOrganization(actor, parsed.data.organizationId);
      if (!organization.ok) return organization;
      const schedule = activitySchedule(parsed.data, organization.value.timezone);
      if (!schedule.ok) return schedule;
      return this.repository.createActivity(actor, { ...parsed.data, schedule: schedule.value });
    });
  }
  archive(raw: unknown) {
    return withPortalActor(this.identity, 'Activities', async (actor) => {
      const parsed = ArchiveSchema.safeParse(raw);
      return parsed.success
        ? this.repository.archiveActivity(actor, parsed.data.organizationId, parsed.data.activityId)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Activities', 'archive');
    });
  }
}
