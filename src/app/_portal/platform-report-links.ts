import type { PlatformReportFilter } from '../../core/validation/platform-reporting';
export function reportQuery(filter: PlatformReportFilter, changes: Record<string, string> = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filter)) {
    if ((typeof value === 'string' && value) || typeof value === 'number')
      query.set(key, String(value));
  }
  for (const [key, value] of Object.entries(changes))
    if (value) query.set(key, value);
    else query.delete(key);
  return query;
}
