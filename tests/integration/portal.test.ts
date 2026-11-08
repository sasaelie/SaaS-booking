import { expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { portalFixture, recurringActivity } from './portal-fixtures';
import { organizationAccess } from '../../src/adapters/db/schema/saas';
import { required } from '../../src/adapters/db/transaction';
import { hasCommercialAccess } from '../../src/core/domain/subscription-access';
it('starts new spaces inactive and only a platform operator can grant complimentary access', async () => {
  const owner = await portalFixture(true);
  const input = recurringActivity(owner.organizationId);
  const denied = await owner.repository.createActivity(owner.actor, input);
  expect(denied.ok).toBe(false);
  if (!denied.ok) expect(denied.error.code).toBe('SUBSCRIPTION_REQUIRED');
  required(await owner.repository.grantAccess(owner.actor, owner.organizationId, true));
  required(await owner.repository.createActivity(owner.actor, input));
  const overview = required(await owner.repository.overview(owner.actor, owner.organizationId));
  expect(overview.activities).toHaveLength(1);
  const other = await portalFixture();
  expect((await other.repository.getOrganization(other.actor, owner.organizationId)).ok).toBe(
    false,
  );
  expect(
    (
      await other.repository.bookings(other.actor, owner.organizationId, {
        page: 1,
        search: '',
        status: '',
      })
    ).ok,
  ).toBe(false);
  expect((await other.repository.grantAccess(other.actor, other.organizationId, true)).ok).toBe(
    false,
  );
  const platform = required(await owner.repository.platform(owner.actor, { page: 1, search: '' }));
  expect(platform.total).toBe(2);
  expect(platform.complimentaryCount).toBe(1);
});
it('keeps reservations open until the paid boundary despite canceled renewal, then refuses new bookings', async () => {
  const context = await fixture();
  const end = new Date(Date.now() + 3600000);
  await db
    .update(organizationAccess)
    .set({ complimentary: false, status: 'ACTIVE', cancelAtPeriodEnd: true, currentPeriodEnd: end })
    .where(eq(organizationAccess.organizationId, context.organizationId));
  const input = rawInput(context);
  expect((await reserve(input)).ok).toBe(true);
  await db
    .update(organizationAccess)
    .set({ currentPeriodEnd: new Date(Date.now() - 1) })
    .where(eq(organizationAccess.organizationId, context.organizationId));
  const denied = await reserve(rawInput(context));
  expect(denied.ok).toBe(false);
  if (!denied.ok) expect(denied.error.code).toBe('SUBSCRIPTION_REQUIRED');
  expect((await reserve(input)).ok).toBe(true);
});
it('keeps account management after expiry and records privileged access changes', async () => {
  const owner = await portalFixture(true);
  required(await owner.repository.grantAccess(owner.actor, owner.organizationId, true));
  const activity = required(
    await owner.repository.createActivity(owner.actor, recurringActivity(owner.organizationId)),
  );
  required(await owner.repository.grantAccess(owner.actor, owner.organizationId, false));
  const organization = required(
    await owner.repository.getOrganization(owner.actor, owner.organizationId),
  );
  expect(hasCommercialAccess(organization.access, new Date())).toBe(false);
  required(
    await owner.repository.archiveActivity(owner.actor, owner.organizationId, activity.activityId),
  );
  const audit = await db.execute(
    sql`SELECT action FROM platform_audit WHERE organization_id=${owner.organizationId}`,
  );
  expect(audit.rows).toHaveLength(2);
});
