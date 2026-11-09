import { expect, it } from 'vitest';
import { eq, sql } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { bookings, sessions, timeSlots } from '../../src/adapters/db/schema';
import { DrizzleRateLimit } from '../../src/adapters/db/drizzle-rate-limit';
import { DrizzleJobRunner } from '../../src/adapters/db/jobs/runner';
import { enqueue } from '../../src/adapters/db/jobs/enqueue';
import { required } from '../../src/adapters/db/transaction';
import { ok } from '../../src/lib/result';
import { ERROR_CODES, JOB_RULES, JOB_TYPES } from '../../src/config/constants';
it('handles fifty simultaneous attempts for the last seat without overselling', async () => {
  const context = await fixture();
  await db
    .update(timeSlots)
    .set({ capacity: 1 })
    .where(eq(timeSlots.activityId, context.activityId));
  const start = performance.now();
  const results = await Promise.all(Array.from({ length: 50 }, () => reserve(rawInput(context))));
  const elapsed = Math.round(performance.now() - start);
  expect(results.filter((result) => result.ok)).toHaveLength(1);
  expect(
    results.filter((result) => !result.ok && result.error.code === ERROR_CODES.SESSION_FULL),
  ).toHaveLength(49);
  expect(await db.select().from(bookings)).toHaveLength(1);
  expect(await db.select().from(sessions)).toHaveLength(1);
  console.info(
    JSON.stringify({
      scenario: 'last-seat',
      attempts: 50,
      confirmed: 1,
      rejectedFull: 49,
      elapsedMs: elapsed,
      scope: 'local-postgres-pool-3',
    }),
  );
});
it('keeps an atomic limit under concurrent requests and allows a new window', async () => {
  const limiter = new DrizzleRateLimit(db);
  const key = crypto.randomUUID();
  const results = await Promise.all(Array.from({ length: 30 }, () => limiter.accept(key)));
  expect(results.filter((result) => result.ok)).toHaveLength(JOB_RULES.RATE_MAX_REQUESTS);
  await db.execute(sql`UPDATE request_limits SET window_start=now()-interval '2 minutes'`);
  expect((await limiter.accept(key)).ok).toBe(true);
});
it('executes durable jobs once across two simultaneous workers', async () => {
  const context = await fixture();
  for (let index = 0; index < 8; index++) {
    required(
      await db.transaction(async (tx) => {
        await enqueue(tx, context.organizationId, JOB_TYPES.CONFIRMATION, `audit:${index}`, {
          bookingId: crypto.randomUUID(),
        });
        return ok(undefined);
      }),
    );
  }
  const handled: string[] = [];
  const handler = {
    async execute(_type: string, _payload: unknown, key: string) {
      handled.push(key);
      return ok({});
    },
  };
  const results = await Promise.all([
    new DrizzleJobRunner(db, handler).runBatch(),
    new DrizzleJobRunner(db, handler).runBatch(),
  ]);
  expect(results.every((result) => result.ok)).toBe(true);
  expect(handled).toHaveLength(8);
  expect(new Set(handled).size).toBe(8);
});
