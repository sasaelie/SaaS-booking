import { expect, it } from 'vitest';
import { SessionEditSchema } from '../../src/core/validation/session-edit';
const input = {
  action: 'update-session',
  organizationId: crypto.randomUUID(),
  activityId: crypto.randomUUID(),
  startsAt: '2026-12-01T13:00:00Z',
  endsAt: '2026-12-01T15:00:00Z',
  capacity: 5,
  newStart: '2026-12-01T15:00',
  newEnd: '2026-12-01T17:00',
  newCapacity: 7,
};
it('requires bounded places and complete dates for a session edit', () => {
  expect(SessionEditSchema.safeParse(input).success).toBe(true);
  for (const change of [
    { newCapacity: 0 },
    { newCapacity: 1.5 },
    { newStart: 'tomorrow' },
    { startsAt: '' },
  ])
    expect(SessionEditSchema.safeParse({ ...input, ...change }).success).toBe(false);
});
