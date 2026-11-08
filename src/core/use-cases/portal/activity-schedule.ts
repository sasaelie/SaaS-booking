import type { CreateActivityInput } from '../../ports/portal-inputs';
import type { ValidatedActivity } from '../../validation/portal-activity';
import { localDayAndTimeToUtc } from '../../domain/timezone';
import { ok, type Result } from '../../../lib/result';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
function localDateTime(date: string, time: string, timezone: string) {
  const [year, month, day] = date.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined)
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Activity', 'date');
  return localDayAndTimeToUtc(year, month - 1, day, time, timezone);
}
export function activitySchedule(
  input: Pick<ValidatedActivity, 'schedule'>,
  timezone: string,
): Result<CreateActivityInput['schedule']> {
  const schedule = input.schedule;
  if (schedule.kind === 'WEEKLY') return ok(schedule);
  const start = localDateTime(schedule.date, schedule.start, timezone);
  if (!start.ok) return start;
  const end = localDateTime(schedule.endDate, schedule.end, timezone);
  if (!end.ok) return end;
  if (start.value.getTime() >= end.value.getTime())
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Activity', 'dates');
  return ok({
    kind: 'MANUAL',
    startsAt: start.value,
    endsAt: end.value,
    capacity: schedule.capacity,
  });
}
