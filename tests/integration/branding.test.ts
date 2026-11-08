import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { portalFixture } from './portal-fixtures';
import { brandFixture } from './brand-fixtures';
import { outboxJobs } from '../../src/adapters/db/schema';
import { required } from '../../src/adapters/db/transaction';
import { purgeBrand } from '../../src/adapters/jobs/purge-brand';
it('decodes images, protects current media from orphan cleanup and purges replaced media', async () => {
  const context = await brandFixture();
  required(await context.useCase.execute(context.input, context.image));
  const first = required(await context.repository.asset(context.organizationId, 'logo'));
  expect(context.files.get(first)?.subarray(0, 8)).toEqual(
    new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  required(
    await purgeBrand(db, context.storage, {
      organizationId: context.organizationId,
      storageKey: first,
    }),
  );
  expect(context.files.has(first)).toBe(true);
  required(await context.useCase.execute(context.input, context.image));
  const second = required(await context.repository.asset(context.organizationId, 'logo'));
  expect(second).not.toBe(first);
  required(
    await purgeBrand(db, context.storage, {
      organizationId: context.organizationId,
      storageKey: first,
    }),
  );
  expect(context.files.has(first)).toBe(false);
  expect(context.files.has(second)).toBe(true);
  required(await context.useCase.remove(context.input));
  required(
    await purgeBrand(db, context.storage, {
      organizationId: context.organizationId,
      storageKey: second,
    }),
  );
  expect(context.files.size).toBe(0);
  expect((await context.repository.asset(context.organizationId, 'logo')).ok).toBe(false);
});
it('rejects truncated images and foreign members before upload and persists a cleanup job on upload failure', async () => {
  const context = await brandFixture();
  expect((await context.useCase.execute(context.input, context.image.subarray(0, 12))).ok).toBe(
    false,
  );
  expect(context.files.size).toBe(0);
  const other = await portalFixture();
  expect((await context.repository.authorize(other.actor, context.organizationId)).ok).toBe(false);
  context.state.failUpload = true;
  expect((await context.useCase.execute(context.input, context.image)).ok).toBe(false);
  const jobs = await db
    .select()
    .from(outboxJobs)
    .where(eq(outboxJobs.organizationId, context.organizationId));
  expect(jobs).toHaveLength(1);
  expect(jobs[0]?.type).toBe('MEDIA_PURGE');
  expect(jobs[0]?.completedAt).toBeNull();
  expect(context.files.size).toBe(0);
});
