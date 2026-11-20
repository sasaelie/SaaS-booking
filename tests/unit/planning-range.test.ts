import { expect, it } from 'vitest';
import { planningRange } from '../../src/app/_planning/planning-range';
import type { PlanningSession } from '../../src/app/_planning/types';
const session: PlanningSession = {
  id: 'night',
  activityId: 'ceramic',
  name: 'Céramique',
  startsAt: '2026-11-18T13:00:00Z',
  endsAt: '2026-11-18T15:00:00Z',
  availability: '4 places',
  isBookable: true,
};
it('frames the sessions of the displayed day and allows all 24 hours without changing sessions', () => {
  const args = [[session], 'Europe/Brussels', ['2026-11-18']] as const;
  expect(planningRange(...args, false)).toEqual({ start: 840, end: 960 });
  expect(planningRange(...args, true)).toEqual({ start: 0, end: 1440 });
  expect(planningRange([session], 'Europe/Brussels', ['2026-11-19'], false)).toEqual({
    start: 540,
    end: 1020,
  });
});
it('frames each part of an overnight session without creating a segment after an exact midnight end', () => {
  const overnight = {
    ...session,
    startsAt: '2026-11-18T22:30:00Z',
    endsAt: '2026-11-19T00:00:00Z',
  };
  expect(planningRange([overnight], 'Europe/Brussels', ['2026-11-18'], false)).toEqual({
    start: 1380,
    end: 1440,
  });
  expect(planningRange([overnight], 'Europe/Brussels', ['2026-11-19'], false)).toEqual({
    start: 0,
    end: 60,
  });
  const midnight = { ...overnight, endsAt: '2026-11-18T23:00:00Z' };
  expect(planningRange([midnight], 'Europe/Brussels', ['2026-11-19'], false)).toEqual({
    start: 540,
    end: 1020,
  });
});
