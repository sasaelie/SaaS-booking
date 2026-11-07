import { BOOKING_LIMITS, ERROR_CODES, INPUT_LIMITS, TIME } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import { validDate } from './date-math';
import type { BuildScheduleInput } from './session-types';
export function validateSchedule(input: BuildScheduleInput): Result<void> {
  const weeks = input.bookingWindowWeeks;
  const validRange =
    [input.now, input.rangeStart, input.rangeEnd].every(validDate) &&
    input.rangeEnd >= input.rangeStart &&
    input.rangeEnd.getTime() - input.rangeStart.getTime() <=
      INPUT_LIMITS.MAX_RANGE_DAYS * TIME.DAY_MS;
  if (
    !validRange ||
    !Number.isInteger(weeks) ||
    weeks < BOOKING_LIMITS.MIN_BOOKING_WINDOW_WEEKS ||
    weeks > BOOKING_LIMITS.MAX_BOOKING_WINDOW_WEEKS
  )
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Schedule', 'validateSchedule');
  return ok(undefined);
}
export function belongsToActivity(
  row: { readonly organizationId: string; readonly activityId: string },
  input: BuildScheduleInput,
): boolean {
  return row.organizationId === input.organizationId && row.activityId === input.activityId;
}
