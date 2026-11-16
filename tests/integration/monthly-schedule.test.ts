import { expect, it } from 'vitest';
import { portalFixture, recurringActivity } from './portal-fixtures';
import { required } from '../../src/adapters/db/transaction';
it('keeps the complete booking window beyond fifty sessions without exposing another organization', async () => {
  const owner = await portalFixture(true);
  required(await owner.repository.grantAccess(owner.actor, owner.organizationId, true));
  const input = recurringActivity(owner.organizationId);
  const activity = required(
    await owner.repository.createActivity(owner.actor, {
      ...input,
      bookingWindowWeeks: 12,
      schedule: {
        kind: 'WEEKLY',
        slots: Array.from({ length: 7 }, (_, dayOfWeek) => ({
          dayOfWeek,
          startTimeLocal: '14:00',
          endTimeLocal: '16:00',
          capacity: 5,
        })),
      },
    }),
  );
  const other = await portalFixture();
  const overview = required(await owner.repository.overview(owner.actor, owner.organizationId));
  expect(overview.sessions.length).toBeGreaterThan(50);
  expect(overview.sessions.every((session) => session.activityId === activity.activityId)).toBe(
    true,
  );
  expect((await other.repository.overview(other.actor, owner.organizationId)).ok).toBe(false);
});
