import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { portalFixture, recurringActivity } from './portal-fixtures';
import { organizationAccess } from '../../src/adapters/db/schema/saas';
import { commercialState } from '../../src/adapters/db/commercial-access';
import { DrizzleActivityRepository } from '../../src/adapters/db/drizzle-activity.repository';
import { required } from '../../src/adapters/db/transaction';
it('preserves complimentary access and existing reservation capabilities', async () => {
  const context = await fixture();
  const state = await commercialState(db, context.organizationId);
  expect(state.pro).toBe(true);
  const activity = required(
    await new DrizzleActivityRepository(db).getActivityWithScheduleConfig(
      context.organizationId,
      context.activityId,
    ),
  );
  expect(activity.commercialAccessAllowed).toBe(true);
  expect((await reserve(rawInput(context))).ok).toBe(true);
});
it('serializes concurrent publication and prevents a third Liberty activity', async () => {
  const owner = await portalFixture();
  const input = { ...recurringActivity(owner.organizationId), priceCents: 0 };
  const results = await Promise.all(
    Array.from({ length: 5 }, () => owner.repository.createActivity(owner.actor, input)),
  );
  expect(results.filter((result) => result.ok)).toHaveLength(2);
  const [access] = await db
    .select()
    .from(organizationAccess)
    .where(eq(organizationAccess.organizationId, owner.organizationId));
  expect(access?.libertyActivityIds).toHaveLength(2);
});
