import { expect, it } from 'vitest';
import {
  currentDay,
  localMinute,
  weekDays,
  weekStart,
} from '../../src/app/_planning/planning-dates';
import {
  activityTone,
  positionSessions,
  sessionPhase,
  sessionOccursOnDay,
  timelineRange,
} from '../../src/app/_planning/planning-sessions';
import type { PlanningSession } from '../../src/app/_planning/types';
const timezone = 'Europe/Brussels';
function session(start: string, end: string, id = start): PlanningSession {
  return {
    id,
    activityId: 'ceramic',
    name: 'Céramique',
    startsAt: start,
    endsAt: end,
    availability: '4 places',
    isBookable: true,
  };
}
it('highlights the organization’s actual day across midnight and DST, independently of the browsed day', () => {
  const midnight = Date.parse('2026-11-18T23:00:00Z');
  expect(currentDay(midnight - 1, timezone)).toBe('2026-11-18');
  expect(currentDay(midnight, timezone)).toBe('2026-11-19');
  expect(currentDay(midnight, 'Pacific/Honolulu')).toBe('2026-11-18');
  expect(currentDay(null, timezone)).toBe('');
  expect(localMinute('2026-10-25T01:30:00Z', timezone)).toBe(150);
  expect(localMinute('2026-11-18T23:00:00Z', timezone)).toBe(0);
});
it('keeps lights on until the exact end, even for a full session, and turns cancellation lights off', () => {
  const row = session('2026-11-18T09:00:00Z', '2026-11-18T11:00:00Z');
  expect(sessionPhase(row, Date.parse(row.startsAt) - 1)).toBe('future');
  expect(sessionPhase({ ...row, isBookable: false }, Date.parse(row.startsAt))).toBe('current');
  expect(sessionPhase(row, Date.parse(row.endsAt) - 1)).toBe('current');
  expect(sessionPhase(row, Date.parse(row.endsAt))).toBe('past');
  expect(sessionPhase({ ...row, isCancelled: true }, Date.parse(row.startsAt) - 1)).toBe(
    'cancelled',
  );
});
it('includes weekends and the next year without drifting during a DST week', () => {
  expect(weekStart('2027-01-01')).toBe('2026-12-28');
  expect(weekDays('2026-10-25')).toEqual([
    '2026-10-19',
    '2026-10-20',
    '2026-10-21',
    '2026-10-22',
    '2026-10-23',
    '2026-10-24',
    '2026-10-25',
  ]);
});
it('gives simultaneous and short adjacent sessions separate columns without mutating the input', () => {
  const rows = [
    session('2026-11-18T09:00:00Z', '2026-11-18T09:15:00Z', 'a'),
    session('2026-11-18T09:15:00Z', '2026-11-18T10:00:00Z', 'b'),
    session('2026-11-18T11:00:00Z', '2026-11-18T12:00:00Z', 'c'),
  ];
  const positioned = positionSessions(rows, timezone);
  expect(positioned.map((row) => [row.column, row.columns])).toEqual([
    [0, 2],
    [1, 2],
    [0, 1],
  ]);
  expect(rows[0]).not.toHaveProperty('column');
});
it('includes early and overnight end times and preserves the activity color in either audience', () => {
  const rows = [
    session('2026-11-18T05:00:00Z', '2026-11-18T06:00:00Z'),
    session('2026-11-18T22:30:00Z', '2026-11-19T00:00:00Z'),
  ];
  expect(timelineRange(rows, timezone)).toEqual({ start: 0, end: 1440 });
  expect(activityTone('ceramic')).toBe(activityTone(rows[0]?.activityId ?? ''));
});

it('shows an overnight session on both days, without a phantom event after an exact midnight end', () => {
  const row = session('2026-11-18T22:30:00Z', '2026-11-19T00:00:00Z');
  expect(sessionOccursOnDay(row, '2026-11-19', timezone)).toBe(true);
  const [nextDay] = positionSessions([row], timezone, '2026-11-19');
  expect(nextDay?.start).toBe(0);
  expect(nextDay?.end).toBe(60);
  expect(
    sessionOccursOnDay({ ...row, endsAt: '2026-11-18T23:00:00Z' }, '2026-11-19', timezone),
  ).toBe(false);
});
