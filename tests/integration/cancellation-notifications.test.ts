import { expect, it } from 'vitest';
import { eq, and } from 'drizzle-orm';
import { db } from './database';
import { cancellationFixture } from './cancellation-mail-fixtures';
import { fixture } from './fixtures';
import { outboxJobs } from '../../src/adapters/db/schema';
import { required } from '../../src/adapters/db/transaction';
import { DrizzleJobRunner } from '../../src/adapters/db/jobs/runner';
import { mailContent, type MailContent } from '../../src/adapters/jobs/mail-content';
import { ok, err } from '../../src/lib/result';
import { errorValue } from '../../src/lib/errors';
import { ERROR_CODES } from '../../src/config/constants';
it('notifies each affected attendee once with the reason, without executing older messages or foreign jobs', async () => {
  const c = await cancellationFixture();
  expect(c.before).toHaveLength(0);
  await unrelatedJobs(c);
  const sent: MailContent[] = [];
  const runner = new DrizzleJobRunner(db, {
    async execute(type, payload) {
      expect(type).toBe('CANCELLATION');
      const message = await mailContent(
        db,
        type,
        payload,
        'https://booking.example.com',
        'test-only-secret-long-enough',
      );
      if (message) sent.push(message);
      return ok({});
    },
  });
  required(
    await runner.runCancellationBatch(c.context.organizationId, c.result.notificationBookingIds),
  );
  required(
    await runner.runCancellationBatch(c.context.organizationId, c.result.notificationBookingIds),
  );
  expect(sent.map((message) => message.to).sort()).toEqual(['one@example.com', 'two@example.com']);
  for (const message of sent) {
    expect(message.text).toContain(c.command.reason);
    expect(message.text).toContain('Test activity');
    expect(message.text).toContain('UTC');
  }
  await pendingJobsUnchanged();
});
it('keeps failed notifications durable and reuses their idempotency key on retry', async () => {
  const c = await cancellationFixture();
  const keys: string[] = [];
  let available = false;
  const runner = new DrizzleJobRunner(db, {
    async execute(_type, _payload, key) {
      keys.push(key);
      return available ? ok({}) : err(errorValue(ERROR_CODES.INTERNAL_ERROR, 'MailTest', 'send'));
    },
  });
  const ids = [c.first.bookingId];
  expect(required(await runner.runCancellationBatch(c.context.organizationId, ids)).deferred).toBe(
    1,
  );
  expect(required(await runner.runCancellationBatch(c.context.organizationId, ids)).completed).toBe(
    0,
  );
  await db
    .update(outboxJobs)
    .set({ availableAt: new Date(Date.now() - 1000) })
    .where(eq(outboxJobs.deduplicationKey, `cancellation:${c.first.bookingId}`));
  available = true;
  expect(required(await runner.runCancellationBatch(c.context.organizationId, ids)).completed).toBe(
    1,
  );
  expect(keys[0]).toBe(keys[1]);
});
it('claims cancellation jobs once across concurrent workers and ignores an empty dispatch', async () => {
  const c = await cancellationFixture();
  const keys: string[] = [];
  const runner = new DrizzleJobRunner(db, {
    async execute(_type, _payload, key) {
      keys.push(key);
      return ok({});
    },
  });
  expect(required(await runner.runCancellationBatch(c.context.organizationId, [])).completed).toBe(
    0,
  );
  await Promise.all([
    runner.runCancellationBatch(c.context.organizationId, c.result.notificationBookingIds),
    runner.runCancellationBatch(c.context.organizationId, c.result.notificationBookingIds),
  ]);
  expect(keys).toHaveLength(2);
  expect(new Set(keys).size).toBe(2);
  const remaining = await db
    .select()
    .from(outboxJobs)
    .where(
      and(
        eq(outboxJobs.type, 'CANCELLATION'),
        eq(outboxJobs.organizationId, c.context.organizationId),
      ),
    );
  expect(remaining.every((job) => job.completedAt !== null)).toBe(true);
});

async function unrelatedJobs(c: Awaited<ReturnType<typeof cancellationFixture>>) {
  const foreign = await fixture();
  await db.insert(outboxJobs).values({
    organizationId: foreign.organizationId,
    type: 'CANCELLATION',
    deduplicationKey: 'foreign',
    payload: { bookingId: c.first.bookingId, reason: 'Foreign job' },
  });
  await db.insert(outboxJobs).values({
    organizationId: c.context.organizationId,
    type: 'REFUND',
    deduplicationKey: 'unrelated-refund',
    payload: {},
  });
}

async function pendingJobsUnchanged() {
  const pending = await db.select().from(outboxJobs);
  expect(pending.find((job) => job.deduplicationKey === 'foreign')?.completedAt).toBeNull();
  expect(pending.find((job) => job.type === 'REFUND')?.completedAt).toBeNull();
  expect(
    pending.filter((job) => job.type === 'CONFIRMATION').every((job) => !job.completedAt),
  ).toBe(true);
}

it('attempts every recipient of one cancellation even when it exceeds the periodic worker batch size', async () => {
  const c = await fixture();
  const ids = Array.from({ length: 25 }, () => crypto.randomUUID());
  await db
    .insert(outboxJobs)
    .values(
      ids.map((id) => ({
        organizationId: c.organizationId,
        type: 'CANCELLATION',
        deduplicationKey: `large:${id}`,
        payload: { bookingId: id, reason: 'Large session' },
      })),
    );
  const runner = new DrizzleJobRunner(db, {
    async execute() {
      return ok({});
    },
  });
  expect(required(await runner.runCancellationBatch(c.organizationId, ids)).completed).toBe(25);
});
