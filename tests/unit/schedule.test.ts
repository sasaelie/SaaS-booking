import { expect, it } from 'vitest';
import { buildTruthSchedule } from '../../src/core/domain/session-truth';
import type { BuildScheduleInput } from '../../src/core/domain/session-types';
const input: BuildScheduleInput = {
  organizationId: 'org',
  activityId: 'activity',
  timezone: 'Europe/Brussels',
  bookingWindowWeeks: 2,
  now: new Date('2026-11-09T08:00:00Z'),
  rangeStart: new Date('2026-11-11T14:00:00Z'),
  rangeEnd: new Date('2026-11-11T16:00:00Z'),
  weeklySlots: [
    {
      organizationId: 'org',
      id: 'slot',
      activityId: 'activity',
      dayOfWeek: 3,
      startTimeLocal: '14:00',
      endTimeLocal: '16:00',
      capacity: 5,
    },
  ],
  pausePeriods: [],
  persistedSessions: [],
  bookingsBySessionId: {},
};
it('filters exact range bounds', () => {
  expect(buildTruthSchedule(input)).toEqual({ ok: true, value: [] });
});
it('filters another activity', () => {
  expect(
    buildTruthSchedule({
      ...input,
      rangeStart: input.now,
      weeklySlots: input.weeklySlots.map((slot) => ({
        ...slot,
        activityId: 'other',
      })),
    }),
  ).toEqual({ ok: true, value: [] });
});
it('keeps the real persisted session even after removing its template', () => {
  const session = {
    id: 's',
    organizationId: 'org',
    activityId: 'activity',
    startsAt: new Date('2026-11-11T15:00:00Z'),
    endsAt: new Date('2026-11-11T18:00:00Z'),
    capacity: 4,
    isManual: false,
    isCancelled: false,
  };
  const result = buildTruthSchedule({
    ...input,
    weeklySlots: [],
    persistedSessions: [session],
  });
  expect(result.ok && result.value[0]?.endsAt).toEqual(session.endsAt);
});
it('rejects negative-duration sessions', () => {
  const result = buildTruthSchedule({
    ...input,
    weeklySlots: input.weeklySlots.map((slot) => ({
      ...slot,
      startTimeLocal: '23:00',
      endTimeLocal: '01:00',
    })),
  });
  expect(result.ok).toBe(false);
});
it('preserves manual sessions during a pause and outside the booking horizon', () => {
  const session = {
    id: 's',
    organizationId: 'org',
    activityId: 'activity',
    startsAt: new Date('2026-12-11T15:00:00Z'),
    endsAt: new Date('2026-12-11T18:00:00Z'),
    capacity: 4,
    isManual: true,
    isCancelled: false,
  };
  const result = buildTruthSchedule({
    ...input,
    rangeEnd: session.endsAt,
    weeklySlots: [],
    persistedSessions: [session],
    pausePeriods: [
      {
        id: 'p',
        organizationId: 'org',
        activityId: 'activity',
        startsAt: input.now,
        endsAt: session.endsAt,
      },
    ],
  });
  expect(result.ok && result.value).toHaveLength(1);
});
