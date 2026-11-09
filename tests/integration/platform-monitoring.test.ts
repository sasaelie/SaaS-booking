import { expect, it } from 'vitest';
import { portalFixture } from './portal-fixtures';
import { db } from './database';
import { outboxJobs, organizations } from '../../src/adapters/db/schema';
import { eq } from 'drizzle-orm';
import { platformAudit } from '../../src/adapters/db/schema/saas';
import { SAAS } from '../../src/config/constants';
import { required } from '../../src/adapters/db/transaction';
it('protects global monitoring and audit history from ordinary organizers', async () => {
  const organizer = await portalFixture();
  const filter = { page: 1, search: '' };
  expect((await organizer.repository.platformOperations(organizer.actor, filter)).ok).toBe(false);
  expect((await organizer.repository.platformHistory(organizer.actor, filter)).ok).toBe(false);
});
it('shows operator-only job metadata and journal entries without exposing payloads', async () => {
  const operator = await portalFixture(true);
  const other = await portalFixture();
  await db.insert(outboxJobs).values({
    organizationId: other.organizationId,
    type: 'CONFIRMATION',
    deduplicationKey: crypto.randomUUID(),
    attempts: 2,
    lastError: 'CONFIGURATION_ERROR',
    payload: { secret: 'never-render-this' },
  });
  required(await operator.repository.suspend(operator.actor, other.organizationId, true));
  const filter = { page: 1, search: '' };
  const operations = required(await operator.repository.platformOperations(operator.actor, filter));
  expect(operations.total).toBe(1);
  expect(operations.failedCount).toBe(1);
  expect(operations.entries[0]?.organizationId).toBe(other.organizationId);
  expect(JSON.stringify(operations)).not.toContain('never-render-this');
  expect(operations.entries[0]).not.toHaveProperty('payload');
  const history = required(await operator.repository.platformHistory(operator.actor, filter));
  expect(history.entries[0]?.action).toBe('SUSPENDED');
  expect(history.entries[0]?.actorName).toBe(operator.actor.name);
  expect(history.entries[0]?.organizationId).toBe(other.organizationId);
});
it('filters monitoring and paginates audit events without duplicates', async () => {
  const operator = await portalFixture(true);
  await db.insert(platformAudit).values(
    Array.from({ length: SAAS.PAGE_SIZE + 1 }, () => ({
      organizationId: operator.organizationId,
      actorUserId: operator.actor.id,
      action: 'ACCESS_GRANTED',
    })),
  );
  const absent = { page: 1, search: 'a-name-that-does-not-exist' };
  expect(required(await operator.repository.platformHistory(operator.actor, absent)).total).toBe(0);
  expect(required(await operator.repository.platformOperations(operator.actor, absent)).total).toBe(
    0,
  );
  const first = required(
    await operator.repository.platformHistory(operator.actor, {
      page: 1,
      search: 'Association de test',
    }),
  );
  const second = required(
    await operator.repository.platformHistory(operator.actor, {
      page: 2,
      search: 'Association de test',
    }),
  );
  expect(first.total).toBe(SAAS.PAGE_SIZE + 1);
  expect(first.entries).toHaveLength(SAAS.PAGE_SIZE);
  expect(second.entries).toHaveLength(1);
  expect(first.entries.some((event) => event.id === second.entries[0]?.id)).toBe(false);
});
it('excludes completed and unrelated operations and prioritizes retries across pages', async () => {
  const operator = await portalFixture(true);
  const other = await portalFixture();
  await operationsForPagination(operator.organizationId, other.organizationId);
  const first = required(
    await operator.repository.platformOperations(operator.actor, {
      page: 1,
      search: 'Recherche ciblée',
    }),
  );
  const second = required(
    await operator.repository.platformOperations(operator.actor, {
      page: 2,
      search: 'Recherche ciblée',
    }),
  );
  expect(first.total).toBe(SAAS.PAGE_SIZE + 1);
  expect(first.failedCount).toBe(1);
  expect(first.entries[0]?.attempts).toBe(2);
  expect(first.entries).toHaveLength(SAAS.PAGE_SIZE);
  expect(second.entries).toHaveLength(1);
  expect(first.entries.some((entry) => entry.id === second.entries[0]?.id)).toBe(false);
});
async function operationsForPagination(organizationId: string, otherOrganizationId: string) {
  await db
    .update(organizations)
    .set({ name: 'Recherche ciblée' })
    .where(eq(organizations.id, organizationId));
  const jobs = Array.from({ length: SAAS.PAGE_SIZE + 1 }, (_, index) => ({
    organizationId,
    type: 'CONFIRMATION',
    deduplicationKey: crypto.randomUUID(),
    payload: {},
    attempts: index === SAAS.PAGE_SIZE ? 2 : 0,
  }));
  await db.insert(outboxJobs).values([
    ...jobs,
    {
      organizationId: otherOrganizationId,
      type: 'CONFIRMATION',
      payload: {},
      deduplicationKey: crypto.randomUUID(),
    },
    {
      organizationId,
      type: 'CONFIRMATION',
      payload: {},
      deduplicationKey: crypto.randomUUID(),
      completedAt: new Date(),
    },
  ]);
}
