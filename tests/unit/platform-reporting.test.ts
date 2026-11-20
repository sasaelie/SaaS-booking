import { describe, it, expect } from 'vitest';
import { parsePlatformReport } from '../../src/core/domain/platform-reporting';
describe('reporting periods', () => {
  it('uses Brussels midnight and a half-open interval across daylight saving time', () => {
    const result = parsePlatformReport({ from: '2026-03-29', to: '2026-03-29' });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.start.toISOString()).toBe('2026-03-28T23:00:00.000Z');
      expect(result.value.end.toISOString()).toBe('2026-03-29T22:00:00.000Z');
    }
  });
  it('rejects invalid, reversed, unbounded and unsupported report filters', () => {
    for (const input of [
      { from: '2026-02-30' },
      { from: '2027-01-01', to: '2026-01-01' },
      { from: '2020-01-01', to: '2026-01-01' },
      { pageSize: 10000 },
      { scope: 'SECRET' },
    ])
      expect(parsePlatformReport(input).ok).toBe(false);
  });
});
