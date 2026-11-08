import { ERROR_CODES, INPUT_LIMITS } from '../../config/constants';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import { possibleInstants } from './timezone-parts';
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
export function parseLocalTime(
  value: string,
): Result<{ readonly hours: number; readonly minutes: number }> {
  const match = TIME_PATTERN.exec(value);
  if (!match?.[1] || !match[2])
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Timezone', 'parseLocalTime');
  return ok({ hours: Number(match[1]), minutes: Number(match[2]) });
}
function validLocalDay(year: number, month: number, day: number): boolean {
  if (
    ![year, month, day].every(Number.isInteger) ||
    year < INPUT_LIMITS.MIN_YEAR ||
    year > INPUT_LIMITS.MAX_YEAR
  )
    return false;
  const date = new Date(Date.UTC(year, month, day));
  return (
    date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day
  );
}
export function localDayAndTimeToUtc(
  year: number,
  month: number,
  day: number,
  value: string,
  timeZone: string,
): Result<Date> {
  const parsed = parseLocalTime(value);
  if (!parsed.ok) return parsed;
  if (!validLocalDay(year, month, day))
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Timezone', 'localDayAndTimeToUtc');
  try {
    const naive = Date.UTC(year, month, day, parsed.value.hours, parsed.value.minutes);
    const candidates = possibleInstants(naive, timeZone);
    return candidates.length === 1 && candidates[0] !== undefined
      ? ok(new Date(candidates[0]))
      : failure(ERROR_CODES.VALIDATION_FAILED, 'Timezone', 'localDayAndTimeToUtc');
  } catch {
    return failure(ERROR_CODES.VALIDATION_FAILED, 'Timezone', 'localDayAndTimeToUtc');
  }
}
