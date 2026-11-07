import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { bookings, organizations, outboxJobs } from '../../src/adapters/db/schema';
import { DrizzleBankRepository } from '../../src/adapters/db/drizzle-bank.repository';
import { DrizzlePauseRepository } from '../../src/adapters/db/drizzle-pause.repository';
import { DrizzleJobRunner } from '../../src/adapters/db/jobs/runner';
import { required } from '../../src/adapters/db/transaction';
import { ok } from '../../src/lib/result';
import { PAYMENT_MODES, JOB_TYPES, BOOKING_STATUSES } from '../../src/config/constants';
it('attaches proof, persists the bank decision, then clears the key after purge succeeds', async () => {
  const context = await fixture(PAYMENT_MODES.BANK_TRANSFER);
  const booked = required(await reserve(rawInput(context)));
  const repository = new DrizzleBankRepository(db);
  expect(booked.bankInstructions?.reference).toMatch(/^\+\+\+\d{3}\/\d{4}\/\d{5}\+\+\+$/);
  required(
    await repository.attachProofToBookingAtomically({
      organizationId: context.organizationId,
      bookingId: booked.bookingId,
      version: 0,
      proofStorageKey: 'test/proof.png',
      now: new Date(),
    }),
  );
  required(
    await repository.finalizeAdminBankDecisionAtomically({
      organizationId: context.organizationId,
      bookingId: booked.bookingId,
      decision: 'APPROVE',
      now: new Date(),
    }),
  );
  await assertApprovedBankBooking();
  const deleted: string[] = [];
  const runner = new DrizzleJobRunner(db, {
    async execute(type, payload) {
      if (type === JOB_TYPES.PURGE) {
        const value = payload as { storageKey: string };
        deleted.push(value.storageKey);
      }
      return ok({});
    },
  });
  required(await runner.runBatch());
  expect(deleted).toEqual(['test/proof.png']);
  const [purged] = await db.select().from(bookings);
  expect(purged?.proofStorageKey).toBeNull();
});
it('rechecks capacity before approving a bank transfer after its hold expired', async () => {
  const context = await fixture(PAYMENT_MODES.BANK_TRANSFER);
  const booked = required(await reserve(rawInput(context)));
  const repository = new DrizzleBankRepository(db);
  required(
    await repository.attachProofToBookingAtomically({
      organizationId: context.organizationId,
      bookingId: booked.bookingId,
      version: 0,
      proofStorageKey: 'test/proof.png',
      now: new Date(),
    }),
  );
  await db
    .update(bookings)
    .set({ lockedUntil: new Date(Date.now() - 1000) })
    .where(eq(bookings.id, booked.bookingId));
  await Promise.all(Array.from({ length: 5 }, () => reserve(rawInput(context))));
  expect(
    (
      await repository.finalizeAdminBankDecisionAtomically({
        organizationId: context.organizationId,
        bookingId: booked.bookingId,
        decision: 'APPROVE',
        now: new Date(),
      })
    ).ok,
  ).toBe(false);
});
it('requires confirmation when adding a pause to an occupied weekly session', async () => {
  const context = await fixture();
  required(await reserve(rawInput(context)));
  const repository = new DrizzlePauseRepository(db);
  const input = {
    organizationId: context.organizationId,
    activityId: context.activityId,
    startsAt: context.startsAt,
    endsAt: new Date(context.startsAt.getTime() + 3600000),
    reason: 'Test pause',
    confirmCancelExistingBookings: false,
  };
  const preview = required(await repository.addPauseAtomically(input));
  expect(preview.status).toBe('CONFIRMATION_REQUIRED');
  if (preview.status !== 'CONFIRMATION_REQUIRED') throw Error('Expected confirmation');
  required(
    await repository.addPauseAtomically({
      ...input,
      confirmCancelExistingBookings: true,
      confirmationHash: preview.confirmationHash,
    }),
  );
  expect((await reserve(rawInput(context))).ok).toBe(false);
});

async function assertApprovedBankBooking() {
  const [approved] = await db.select().from(bookings);
  expect(approved?.status).toBe(BOOKING_STATUSES.CONFIRMED);
  expect(approved?.amountPaidCents).toBe(3000);
  expect(approved?.proofStorageKey).toBe('test/proof.png');
}

it('respects an organization explicitly disabling automatic proof deletion', async () => {
  const context = await fixture(PAYMENT_MODES.BANK_TRANSFER);
  const booked = required(await reserve(rawInput(context)));
  const repository = new DrizzleBankRepository(db);
  await db
    .update(organizations)
    .set({ autoDeleteBankProof: false })
    .where(eq(organizations.id, context.organizationId));
  required(
    await repository.attachProofToBookingAtomically({
      organizationId: context.organizationId,
      bookingId: booked.bookingId,
      version: 0,
      proofStorageKey: 'retained.png',
      now: new Date(),
    }),
  );
  const result = required(
    await repository.finalizeAdminBankDecisionAtomically({
      organizationId: context.organizationId,
      bookingId: booked.bookingId,
      decision: 'APPROVE',
      now: new Date(),
    }),
  );
  expect(result.proofStorageKey).toBeNull();
  const jobs = await db.select().from(outboxJobs);
  expect(jobs.filter((job) => job.type === JOB_TYPES.PURGE)).toHaveLength(0);
});
