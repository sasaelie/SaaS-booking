import { expect, it } from 'vitest';
import {
  planningMonthDays,
  planningPeriod,
  movePlanningPeriod,
} from '../../src/app/_planning/planning-period';
import type { PlanningSession } from '../../src/app/_planning/types';
const timezone = 'Europe/Brussels';
function session(startsAt: string, endsAt: string): PlanningSession {
  return {
    id: startsAt,
    activityId: 'ceramic',
    name: 'Céramique',
    startsAt,
    endsAt,
    availability: '4 places',
    isBookable: true,
  };
}
it('aligns months to Monday with complete weeks, including leap days and exact four-week months', () => {
  const november = planningMonthDays('2026-11-23');
  expect(november).toHaveLength(42);
  expect(november.slice(0, 7)).toEqual([null, null, null, null, null, null, '2026-11-01']);
  expect(november.filter(Boolean)).toHaveLength(30);
  expect(planningMonthDays('2024-02-15')).toContain('2024-02-29');
  expect(planningMonthDays('2021-02-15')).toHaveLength(28);
});
it('includes the local part of an overnight session in the next month, but not an exact midnight end', () => {
  const night = session('2026-03-31T21:30:00Z', '2026-03-31T23:30:00Z');
  const props = { sessions: [night], timezone };
  expect(planningPeriod(props, '2026-04-01', 'month').sessions).toEqual([night]);
  expect(planningPeriod(props, '2026-03-01', 'month').next).toBe(true);
  const midnight = { ...night, endsAt: '2026-03-31T22:00:00Z' };
  expect(planningPeriod({ ...props, sessions: [midnight] }, '2026-03-01', 'month').next).toBe(
    false,
  );
  expect(
    planningPeriod({ ...props, sessions: [midnight] }, '2026-04-01', 'month').sessions,
  ).toEqual([]);
});
it('navigates through an empty month and across a year, keeping the first actual session visible', () => {
  const sessions = [
    session('2026-11-23T13:00:00Z', '2026-11-23T15:00:00Z'),
    session('2027-01-08T10:00:00Z', '2027-01-08T11:00:00Z'),
  ];
  expect(movePlanningPeriod('2026-11-23', 1, 'month', sessions, timezone)).toBe('2026-12-01');
  expect(movePlanningPeriod('2026-12-01', 1, 'month', sessions, timezone)).toBe('2027-01-08');
  const december = planningPeriod({ sessions, timezone }, '2026-12-01', 'month');
  expect(december.sessions).toEqual([]);
  expect(december.previous && december.next).toBe(true);
  expect(planningPeriod({ sessions, timezone }, '2027-01-08', 'month').next).toBe(false);
});
it('keeps weekly navigation and empty calendar bounds consistent', () => {
  const sessions = [
    session('2026-11-23T13:00:00Z', '2026-11-23T15:00:00Z'),
    session('2026-12-02T10:00:00Z', '2026-12-02T11:00:00Z'),
  ];
  expect(movePlanningPeriod('2026-11-23', 1, 'week', sessions, timezone)).toBe('2026-12-02');
  expect(planningPeriod({ sessions: [], timezone }, '', 'month')).toEqual({
    days: [],
    sessions: [],
    previous: false,
    next: false,
  });
});
