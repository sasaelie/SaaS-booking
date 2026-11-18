import { PlatformReportSchema, type PlatformReportInput } from '../validation/platform-reporting';
import { PLATFORM_REPORTING as REPORT } from '../../config/platform-reporting';
import { TIME, ERROR_CODES } from '../../config/constants';
import { localDayAndTimeToUtc } from './timezone';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
export function parsePlatformReport(raw: unknown): Result<PlatformReportInput> {
  const parsed = PlatformReportSchema.safeParse(raw);
  if (!parsed.success) return failure(ERROR_CODES.VALIDATION_FAILED, 'PlatformReport', 'period');
  const from = new Date(`${parsed.data.from}T12:00:00Z`);
  const until = new Date(Date.parse(`${parsed.data.to}T12:00:00Z`) + TIME.DAY_MS);
  const start = localDayAndTimeToUtc(
    from.getUTCFullYear(),
    from.getUTCMonth(),
    from.getUTCDate(),
    REPORT.MIDNIGHT,
    REPORT.TIMEZONE,
  );
  const end = localDayAndTimeToUtc(
    until.getUTCFullYear(),
    until.getUTCMonth(),
    until.getUTCDate(),
    REPORT.MIDNIGHT,
    REPORT.TIMEZONE,
  );
  if (!start.ok || !end.ok)
    return failure(ERROR_CODES.VALIDATION_FAILED, 'PlatformReport', 'timezone');
  return ok({ ...parsed.data, start: start.value, end: end.value });
}
