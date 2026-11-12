import { expect, it } from 'vitest';
import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { eq, sql } from 'drizzle-orm';
import { db, pool } from './database';
import { fixture } from './fixtures';
import { outboxJobs, financialEntries } from '../../src/adapters/db/schema';
import { paidBooking } from './lifecycle-fixtures';
import { DrizzleJobRunner } from '../../src/adapters/db/jobs/runner';
import { ok } from '../../src/lib/result';
import { required } from '../../src/adapters/db/transaction';
it('lets three workers perform database-backed effects with only three pool connections', async () => {
  const context = await fixture();
  await db.insert(outboxJobs).values(
    Array.from({ length: 3 }, () => ({
      organizationId: context.organizationId,
      type: 'CONFIRMATION',
      payload: {},
      deduplicationKey: crypto.randomUUID(),
    })),
  );
  const limited = new Pool({
    connectionString: pool.options.connectionString,
    max: 3,
    connectionTimeoutMillis: 400,
  });
  const shared = drizzle(limited);
  let started = 0;
  let release = () => {};
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  const runner = new DrizzleJobRunner(shared, {
    execute: async () => {
      started++;
      if (started === 3) release();
      await ready;
      await shared.execute(sql`SELECT 1`);
      return ok({});
    },
  });
  try {
    const results = await Promise.all(Array.from({ length: 3 }, () => runner.runBatch()));
    expect(results.every((r) => r.ok)).toBe(true);
    expect((await db.select().from(outboxJobs)).every((j) => j.completedAt)).toBe(true);
  } finally {
    await limited.end();
  }
});
async function refundableJob() {
  const input = await paidBooking();
  await db.delete(outboxJobs);
  const [job] = await db
    .insert(outboxJobs)
    .values({
      organizationId: input.context.organizationId,
      type: 'REFUND',
      deduplicationKey: 'lease:refund',
      payload: {
        bookingId: input.booking.bookingId,
        amountCents: 3000,
        paymentReference: `pi_${input.booking.bookingId}`,
        merchantAccountId: null,
        idempotencyKey: 'lease:refund',
      },
    })
    .returning();
  if (!job) throw Error('Missing fixture');
  return job;
}
it('recovers an expired lease and prevents the stale worker from recording a second refund', async () => {
  const job = await refundableJob();
  let announce = () => {};
  let release = () => {};
  const started = new Promise<void>((r) => {
    announce = r;
  });
  const blocked = new Promise<void>((r) => {
    release = r;
  });
  const old = new DrizzleJobRunner(db, {
    execute: async () => {
      announce();
      await blocked;
      return ok({ refundId: 're_stale', status: 'SUCCEEDED' });
    },
  }).runBatch();
  await started;
  try {
    await db
      .update(outboxJobs)
      .set({ availableAt: new Date(0) })
      .where(eq(outboxJobs.id, job.id));
    const replacement = new DrizzleJobRunner(db, {
      execute: async (type) =>
        type === 'REFUND' ? ok({ refundId: 're_current', status: 'SUCCEEDED' as const }) : ok({}),
    });
    required(await replacement.runBatch());
  } finally {
    release();
    await old;
  }
  const entries = (await db.select().from(financialEntries)).filter((e) => e.kind === 'REFUND');
  expect(entries).toHaveLength(1);
  expect(entries[0]?.reference).toBe('re_current');
});
