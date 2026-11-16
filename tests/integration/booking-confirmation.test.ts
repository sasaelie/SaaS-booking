import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { confirmed, secret } from './participant-fixtures';
import { fixture, rawInput, reserve } from './fixtures';
import { required } from '../../src/adapters/db/transaction';
import { outboxJobs, bookings } from '../../src/adapters/db/schema';
import { DrizzleJobRunner } from '../../src/adapters/db/jobs/runner';
import { mailContent, type MailContent } from '../../src/adapters/jobs/mail-content';
import { ok, err } from '../../src/lib/result';
import { errorValue } from '../../src/lib/errors';
import { ERROR_CODES } from '../../src/config/constants';
it('sends one confirmation with the durable code and ticket link, scoped to one organization and booking', async () => {
  const { context: first, booking, ticket } = await confirmed();
  const second = await fixture();
  required(await reserve(rawInput(second)));
  await unrelatedJob(first.organizationId, booking.bookingId);
  const messages: MailContent[] = [];
  const runner = new DrizzleJobRunner(db, {
    async execute(type, payload) {
      expect(type).toBe('CONFIRMATION');
      const content = await mailContent(db, type, payload, 'https://booking.example.com', secret);
      if (content) messages.push(content);
      return ok({});
    },
  });
  await Promise.all([
    runner.runConfirmation(first.organizationId, booking.bookingId),
    runner.runConfirmation(first.organizationId, booking.bookingId),
  ]);
  required(await runner.runConfirmation(first.organizationId, booking.bookingId));
  expect(messages).toHaveLength(1);
  expect(messages[0]?.text).toContain(ticket.code);
  expect(messages[0]?.text).toContain('https://booking.example.com/manage#code=CLI-');
  const jobs = await db.select().from(outboxJobs);
  expect(jobs.filter((job) => job.completedAt)).toHaveLength(1);
  expect(jobs.filter((job) => job.type === 'CANCELLATION').every((job) => job.attempts === 0)).toBe(
    true,
  );
});
it('keeps a failed confirmation recoverable without reverting a confirmed booking or duplicating its idempotency key', async () => {
  const context = await fixture(),
    booking = required(await reserve(rawInput(context)));
  const keys: string[] = [];
  let ready = false;
  const runner = new DrizzleJobRunner(db, {
    async execute(_type, _payload, key) {
      keys.push(key);
      return ready ? ok({}) : err(errorValue(ERROR_CODES.INTERNAL_ERROR, 'MailTest', 'send'));
    },
  });
  expect(
    required(await runner.runConfirmation(context.organizationId, booking.bookingId)).deferred,
  ).toBe(1);
  const [saved] = await db.select().from(bookings).where(eq(bookings.id, booking.bookingId));
  expect(saved?.status).toBe('CONFIRMED');
  await db.update(outboxJobs).set({ availableAt: new Date(0) });
  ready = true;
  expect(
    required(await runner.runConfirmation(context.organizationId, booking.bookingId)).completed,
  ).toBe(1);
  expect(keys).toEqual([`confirmation:${booking.bookingId}`, `confirmation:${booking.bookingId}`]);
});

async function unrelatedJob(organizationId: string, bookingId: string) {
  await db
    .insert(outboxJobs)
    .values({
      organizationId,
      type: 'CANCELLATION',
      deduplicationKey: 'unrelated',
      payload: { bookingId },
    });
}
