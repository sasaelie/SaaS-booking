import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { PortalRepositoryPort } from '../../ports/portal-repository.port';
import type { SessionEditPort, SessionEditOutcome } from '../../ports/session-edit.port';
import { SessionEditSchema, type SessionEditInput } from '../../validation/session-edit';
import { activitySchedule } from './activity-schedule';
import { withPortalActor } from './actor';
import { failure } from '../../../lib/errors';
import { ERROR_CODES } from '../../../config/constants';
import type { Result } from '../../../lib/result';
export class SessionEditUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly organizations: PortalRepositoryPort,
    private readonly repository: SessionEditPort,
  ) {}
  execute(raw: unknown): Promise<Result<SessionEditOutcome>> {
    return withPortalActor(this.identity, 'SessionEdit', async (actor) => {
      const input = SessionEditSchema.safeParse(raw);
      if (!input.success) return failure(ERROR_CODES.VALIDATION_FAILED, 'SessionEdit', 'input');
      const organization = await this.organizations.getOrganization(
        actor,
        input.data.organizationId,
      );
      if (!organization.ok) return organization;
      const converted = editSchedule(input.data, organization.value.timezone);
      if (!converted.ok) return converted;
      if (converted.value.kind !== 'MANUAL')
        return failure(ERROR_CODES.VALIDATION_FAILED, 'SessionEdit', 'schedule');
      return this.repository.update(actor, {
        ...input.data,
        newStartsAt: converted.value.startsAt,
        newEndsAt: converted.value.endsAt,
      });
    });
  }
}
function editSchedule(input: SessionEditInput, timezone: string) {
  const [date = '', start = ''] = input.newStart.split('T');
  const [endDate = '', end = ''] = input.newEnd.split('T');
  return activitySchedule(
    { schedule: { kind: 'MANUAL', date, start, endDate, end, capacity: input.newCapacity } },
    timezone,
  );
}
