// src/core/domain/timezone.ts
import { ERROR_CODES } from '../../config/constants';
import { failAndLog } from '../../lib/logger';
import { ok, type AppError, type Result } from '../../lib/result';

const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
export function parseLocalTime(
  timeStr: string,
): Result<{ readonly hours: number; readonly minutes: number }, AppError> {
  const match = TIME_PATTERN.exec(timeStr);
  if (!match || match[1] === undefined || match[2] === undefined) {
    return failAndLog({
      code: ERROR_CODES.VALIDATION_FAILED,
      module: 'Timezone',
      fn: 'parseLocalTime',
      cause: 'Format horaire local invalide',
      received: timeStr,
      expected: 'HH:mm (00:00 à 23:59)',
    });
  }
  return ok({ hours: Number(match[1]), minutes: Number(match[2]) });
}
function getTimezoneOffsetMs(utcDate: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(utcDate);
  const map: Record<string, number> = {};
  for (const part of parts) {
    if (part.type !== 'literal') map[part.type] = Number(part.value);
  }
  const asUtc = Date.UTC(
    map['year'] ?? 1970,
    (map['month'] ?? 1) - 1,
    map['day'] ?? 1,
    map['hour'] ?? 0,
    map['minute'] ?? 0,
    map['second'] ?? 0,
  );
  return asUtc - utcDate.getTime();
}
export function localDayAndTimeToUtc(
  year: number,
  monthZeroIndexed: number,
  day: number,
  timeLocal: string,
  timeZone: string,
): Result<Date, AppError> {
  const parsed = parseLocalTime(timeLocal);
  if (!parsed.ok) return parsed;
  const naiveUtcMs = Date.UTC(
    year,
    monthZeroIndexed,
    day,
    parsed.value.hours,
    parsed.value.minutes,
    0,
    0,
  );
  const initialOffset = getTimezoneOffsetMs(new Date(naiveUtcMs), timeZone);
  const firstPassUtc = new Date(naiveUtcMs - initialOffset);
  const refinedOffset = getTimezoneOffsetMs(firstPassUtc, timeZone);
  return ok(new Date(naiveUtcMs - refinedOffset));
}
