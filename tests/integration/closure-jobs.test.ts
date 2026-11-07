import { eq } from 'drizzle-orm';
import { PAYMENT_MODES } from '../../src/config/constants';
import { expect, it } from 'vitest';

import { db } from './database';
import { paidBooking } from './lifecycle-fixtures';
import { fixture, rawInput, reserve } from './fixtures';
import { DrizzleClosureRepository } from '../../src/adapters/db/drizzle-closure.repository';
import { DrizzleJobRunner } from '../../src/adapters/db/jobs/runner';
import { outboxJobs, sessions, bookings } from '../../src/adapters/db/schema';
import { required } from '../../src/adapters/db/transaction';
import { ok, err } from '../../src/lib/result';
import { errorValue } from '../../src/lib/errors';
import { ERROR_CODES } from '../../src/config/constants';
it('requires a fresh confirmation then closes before publishing refund work', async () => {
  const input = await paidBooking();
  const repository = new DrizzleClosureRepository(db);
  const command = {
    organizationId: input.context.organizationId,
    sessionId: input.booking.sessionId,
    confirmCancelExistingBookings: false,
    reason: 'Test closure',
  };
  const first = required(await repository.closeSessionAtomically(command));
  expect(first.status).toBe('CONFIRMATION_REQUIRED');
  if (first.status !== 'CONFIRMATION_REQUIRED') throw Error('Expected confirmation');
  const result = required(
    await repository.closeSessionAtomically({
      ...command,
      confirmCancelExistingBookings: true,
      confirmationHash: first.confirmationHash,
    }),
  );
  expect(result.status).toBe('CLOSED_AND_REFUNDS_QUEUED');
  expect((await reserve(rawInput(input.context))).ok).toBe(false);
  const [session] = await db.select().from(sessions);
  expect(session?.isCancelled).toBe(true);
});
it('defers failed effects durably and resumes them after retry delay', async () => {
  await paidBooking();
  let succeeds = false;
  const runner = new DrizzleJobRunner(db, {
    async execute() {
      return succeeds
        ? ok({})
        : err(errorValue(ERROR_CODES.PAYMENT_PROVIDER_ERROR, 'Test', 'effect'));
    },
  });
  const first = required(await runner.runBatch());
  expect(first.deferred).toBe(1);
  const [job] = await db.select().from(outboxJobs);
  expect(job?.completedAt).toBeNull();
  expect(job?.attempts).toBe(1);
  succeeds = true;
  await db.update(outboxJobs).set({ availableAt: new Date(Date.now() - 1000) });
  const second = required(await runner.runBatch());
  expect(second.completed).toBe(1);
  expect(required(await runner.runBatch()).completed).toBe(0);
});

it('does not require participant confirmation for an already expired payment hold', async () => {
  const context = await fixture(PAYMENT_MODES.STRIPE);
  const booking = required(await reserve(rawInput(context)));
  await db
    .update(bookings)
    .set({ lockedUntil: new Date(Date.now() - 1000) })
    .where(eq(bookings.id, booking.bookingId));
  const result = required(
    await new DrizzleClosureRepository(db).closeSessionAtomically({
      organizationId: context.organizationId,
      sessionId: booking.sessionId,
      confirmCancelExistingBookings: false,
      reason: 'Close expired hold',
    }),
  );
  expect(result.status).toBe('CLOSED_AND_REFUNDS_QUEUED');
});
