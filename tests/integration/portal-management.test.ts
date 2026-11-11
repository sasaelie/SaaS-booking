import { expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from './database';
import { portalFixture, recurringActivity } from './portal-fixtures';
import { required } from '../../src/adapters/db/transaction';
import { organizationMembers, organizationAccess } from '../../src/adapters/db/schema/saas';
it('allows a manager to manage activities but never settings, subscriptions or operator grants', async () => {
  const owner = await portalFixture(true);
  const manager = await portalFixture();
  required(await owner.repository.grantAccess(owner.actor, owner.organizationId, true));
  await db
    .insert(organizationMembers)
    .values({ organizationId: owner.organizationId, userId: manager.actor.id, role: 'MANAGER' });
  const activity = required(
    await manager.repository.createActivity(manager.actor, recurringActivity(owner.organizationId)),
  );
  expect((await manager.repository.getOrganization(manager.actor, owner.organizationId)).ok).toBe(
    true,
  );
  expect(
    (
      await manager.repository.updateSettings(manager.actor, {
        organizationId: owner.organizationId,
        name: 'Intrusion',
        bankIban: null,
        bankAccountName: null,
        theme: 'SAGE',
        autoDeleteBankProof: true,
      })
    ).ok,
  ).toBe(false);
  await editManagedActivity(manager, owner.organizationId, activity.activityId);
  expect((await manager.repository.grantAccess(manager.actor, owner.organizationId, true)).ok).toBe(
    false,
  );
});
it('keeps dates, two publications, history and settings accessible in Liberty after expiry', async () => {
  const owner = await portalFixture(true);
  required(await owner.repository.grantAccess(owner.actor, owner.organizationId, true));
  const activity = required(
    await owner.repository.createActivity(owner.actor, recurringActivity(owner.organizationId)),
  );
  required(await owner.repository.grantAccess(owner.actor, owner.organizationId, false));
  const startsAt = new Date(Date.now() + 86400000);
  const endsAt = new Date(startsAt.getTime() + 3600000);
  expect(
    (
      await owner.repository.addSession(owner.actor, {
        organizationId: owner.organizationId,
        activityId: activity.activityId,
        startsAt,
        endsAt,
        capacity: 5,
      })
    ).ok,
  ).toBe(true);
  expect(
    (await owner.repository.publishActivity(owner.actor, owner.organizationId, activity.activityId))
      .ok,
  ).toBe(true);
  expect((await owner.repository.overview(owner.actor, owner.organizationId)).ok).toBe(true);
  required(
    await owner.repository.updateSettings(owner.actor, {
      organizationId: owner.organizationId,
      name: 'Club mis à jour',
      bankIban: null,
      bankAccountName: null,
      theme: 'IVORY',
      autoDeleteBankProof: true,
    }),
  );
});
it('refuses a complimentary grant once billing has started, including concurrent checkout', async () => {
  const owner = await portalFixture(true);
  await db
    .update(organizationAccess)
    .set({ stripeCustomerId: 'cus_pending' })
    .where(eq(organizationAccess.organizationId, owner.organizationId));
  expect((await owner.repository.grantAccess(owner.actor, owner.organizationId, true)).ok).toBe(
    false,
  );
  await db.execute(
    sql`UPDATE organization_access SET stripe_customer_id=NULL WHERE organization_id=${owner.organizationId}`,
  );
  const { pool } = await import('./database');
  const client = await pool.connect();
  try {
    await client.query('SELECT pg_advisory_lock(hashtextextended($1,0))', [
      `billing:${owner.organizationId}`,
    ]);
    expect((await owner.repository.grantAccess(owner.actor, owner.organizationId, true)).ok).toBe(
      false,
    );
  } finally {
    await client.query('SELECT pg_advisory_unlock(hashtextextended($1,0))', [
      `billing:${owner.organizationId}`,
    ]);
    client.release();
  }
});

async function editManagedActivity(
  manager: Awaited<ReturnType<typeof portalFixture>>,
  organizationId: string,
  activityId: string,
) {
  const { schedule, ...input } = recurringActivity(organizationId);
  void schedule;
  required(
    await manager.repository.updateActivity(manager.actor, {
      ...input,
      name: 'Nouveau titre',
      activityId: activityId,
    }),
  );
  required(await manager.repository.archiveActivity(manager.actor, organizationId, activityId));
  required(await manager.repository.publishActivity(manager.actor, organizationId, activityId));
}
