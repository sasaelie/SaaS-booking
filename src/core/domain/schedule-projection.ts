import { ERROR_CODES, TIME } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import { localDayAndTimeToUtc } from './timezone';
import { localParts } from './timezone-parts';
import type { BuildScheduleInput, PersistedSession, TimeSlotRule } from './session-types';
export function localDays(input: BuildScheduleInput): Result<readonly Date[]> {
  try {
    const [sy = NaN, sm = NaN, sd = NaN] = localParts(input.rangeStart, input.timezone);
    const [ey = NaN, em = NaN, ed = NaN] = localParts(input.rangeEnd, input.timezone);
    const result: Date[] = [];
    for (let time = Date.UTC(sy, sm - 1, sd); time <= Date.UTC(ey, em - 1, ed); time += TIME.DAY_MS)
      result.push(new Date(time));
    return ok(result);
  } catch {
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Schedule', 'localDays');
  }
}
export function projectSlot(
  day: Date,
  slot: TimeSlotRule,
  input: BuildScheduleInput,
): Result<PersistedSession | null> {
  if (slot.dayOfWeek !== day.getUTCDay()) return ok(null);
  const params = [day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()] as const;
  const start = localDayAndTimeToUtc(...params, slot.startTimeLocal, input.timezone);
  if (!start.ok) return start;
  const end = localDayAndTimeToUtc(...params, slot.endTimeLocal, input.timezone);
  if (!end.ok) return end;
  return ok({
    id: '',
    organizationId: input.organizationId,
    activityId: input.activityId,
    startsAt: start.value,
    endsAt: end.value,
    capacity: slot.capacity,
    isManual: false,
    isCancelled: false,
  });
}
