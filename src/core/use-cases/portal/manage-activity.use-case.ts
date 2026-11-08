import { z } from 'zod';
import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { PortalRepositoryPort } from '../../ports/portal-repository.port';
import {
  UpdateActivitySchema,
  AddSessionSchema,
  RecordRefundSchema,
} from '../../validation/portal-activity';
import { withPortalActor } from './actor';
import { activitySchedule } from './activity-schedule';
import { failure } from '../../../lib/errors';
import { ERROR_CODES } from '../../../config/constants';
const PublishSchema = z.object({ organizationId: z.uuid(), activityId: z.uuid() });
export class ManageActivityUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: PortalRepositoryPort,
  ) {}
  update(raw: unknown) {
    return withPortalActor(this.identity, 'Activity', async (actor) => {
      const input = UpdateActivitySchema.safeParse(raw);
      return input.success
        ? this.repository.updateActivity(actor, input.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Activity', 'update');
    });
  }
  publish(raw: unknown) {
    return withPortalActor(this.identity, 'Activity', async (actor) => {
      const input = PublishSchema.safeParse(raw);
      return input.success
        ? this.repository.publishActivity(actor, input.data.organizationId, input.data.activityId)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Activity', 'publish');
    });
  }
  addSession(raw: unknown) {
    return withPortalActor(this.identity, 'Session', async (actor) => {
      const input = AddSessionSchema.safeParse(raw);
      if (!input.success) return failure(ERROR_CODES.VALIDATION_FAILED, 'Session', 'input');
      const organization = await this.repository.getOrganization(actor, input.data.organizationId);
      if (!organization.ok) return organization;
      const schedule = activitySchedule(
        { schedule: input.data.schedule },
        organization.value.timezone,
      );
      if (!schedule.ok) return schedule;
      if (schedule.value.kind !== 'MANUAL')
        return failure(ERROR_CODES.VALIDATION_FAILED, 'Session', 'input');
      return this.repository.addSession(actor, {
        organizationId: input.data.organizationId,
        activityId: input.data.activityId,
        startsAt: schedule.value.startsAt,
        endsAt: schedule.value.endsAt,
        capacity: schedule.value.capacity,
      });
    });
  }
  refund(raw: unknown) {
    return withPortalActor(this.identity, 'Refund', async (actor) => {
      const input = RecordRefundSchema.safeParse(raw);
      return input.success
        ? this.repository.recordBankRefund(
            actor,
            input.data.organizationId,
            input.data.bookingId,
            input.data.reference,
          )
        : failure(ERROR_CODES.VALIDATION_FAILED, 'Refund', 'input');
    });
  }
}
