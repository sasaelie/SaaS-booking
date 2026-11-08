import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { PortalRepositoryPort } from '../../ports/portal-repository.port';
import type { AddPauseUseCase } from '../add-pause.use-case';
import { LocalPauseSchema } from '../../validation/local-pause';
import { localDayAndTimeToUtc } from '../../domain/timezone';
import { withPortalActor } from './actor';
import { ERROR_CODES, TIME } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { ok } from '../../../lib/result';
function midnight(date: string, timezone: string) {
  const [year, month, day] = date.split('-').map(Number);
  return year !== undefined && month !== undefined && day !== undefined
    ? localDayAndTimeToUtc(year, month - 1, day, '00:00', timezone)
    : failure(ERROR_CODES.VALIDATION_FAILED, 'Pause', 'date');
}
function pauseDates(date: string, endDate: string, timezone: string) {
  const start = midnight(date, timezone);
  if (!start.ok) return start;
  const lastDay = midnight(endDate, 'UTC');
  if (!lastDay.ok) return lastDay;
  const exclusive = new Date(lastDay.value.getTime() + TIME.DAY_MS).toISOString().split('T')[0];
  if (!exclusive) return failure(ERROR_CODES.VALIDATION_FAILED, 'Pause', 'date');
  const end = midnight(exclusive, timezone);
  if (!end.ok) return end;
  return ok({ startsAt: start.value, endsAt: end.value });
}
export class LocalPauseUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repo: PortalRepositoryPort,
    private readonly pause: AddPauseUseCase,
  ) {}
  execute(raw: unknown) {
    return withPortalActor(this.identity, 'LocalPause', async (actor) => {
      const parsed = LocalPauseSchema.safeParse(raw);
      if (!parsed.success) return failure(ERROR_CODES.VALIDATION_FAILED, 'Pause', 'input');
      const input = parsed.data;
      const organization = await this.repo.getOrganization(actor, input.organizationId);
      if (!organization.ok) return organization;
      const dates = pauseDates(input.date, input.endDate, organization.value.timezone);
      return dates.ok ? this.pause.execute({ ...input, ...dates.value }) : dates;
    });
  }
}
