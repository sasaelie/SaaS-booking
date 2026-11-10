import { expect, it } from 'vitest';
import { SessionDetailsSchema } from '../../src/core/validation/session-details';
const input = {
  organizationId: crypto.randomUUID(),
  activityId: crypto.randomUUID(),
  startsAt: '2027-01-01T13:00:00.000Z',
};
it('identifies a generated session by activity and exact instant without a persisted session id', () => {
  expect(SessionDetailsSchema.parse(input)).toEqual({ ...input, page: 1 });
});
it.each([
  { startsAt: '01/01/2027' },
  { organizationId: 'foreign' },
  { activityId: '' },
  { page: 0 },
  { page: '1.5' },
])('rejects malformed detail requests: %j', (override) => {
  expect(SessionDetailsSchema.safeParse({ ...input, ...override }).success).toBe(false);
});
