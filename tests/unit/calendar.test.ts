import { expect, it } from 'vitest';
import { localDay, monthDays, shiftMonth } from '../../src/app/_ui/calendar-dates';
it('maps a session to its organizer calendar day across UTC and DST boundaries', () => {
  const iso = '2026-10-25T23:30:00.000Z';
  expect(localDay(iso, 'Europe/Brussels')).toBe('2026-10-26');
  expect(localDay(iso, 'Pacific/Honolulu')).toBe('2026-10-25');
});
it('keeps Monday alignment, leap days and year changes in the calendar', () => {
  const days = monthDays('2028-02');
  expect(days[0]).toBeNull();
  expect(days[1]).toBe('2028-02-01');
  expect(days.at(-1)).toBe('2028-02-29');
  expect(shiftMonth('2026-12', 1)).toBe('2027-01');
  expect(shiftMonth('2027-01', -1)).toBe('2026-12');
});
