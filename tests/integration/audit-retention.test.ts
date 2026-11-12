import { expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { bookings, outboxJobs } from '../../src/adapters/db/schema';
import { DrizzleBankRepository } from '../../src/adapters/db/drizzle-bank.repository';
import { DrizzleGdprRepository } from '../../src/adapters/db/drizzle-gdpr.repository';
import { BankTransferWorkflowUseCase } from '../../src/core/use-cases/bank-transfer-workflow.use-case';
import { GdprRetentionUseCase } from '../../src/core/use-cases/gdpr-retention.use-case';
import { required } from '../../src/adapters/db/transaction';
import { ok } from '../../src/lib/result';
const authorization = { authorizeOrganizationAdmin: async () => ok(undefined) };
const flags = ['proofIsAccounting', 'legalHold', 'disputeOpen'] as const;
it.each(flags)(
  'preserves a protected %s proof during bank approval and repeated approval',
  async (flag) => {
    const context = await fixture('BANK_TRANSFER');
    const booked = required(await reserve(rawInput(context)));
    await db
      .update(bookings)
      .set({ status: 'PROOF_SUBMITTED', proofStorageKey: 'protected.png', [flag]: true })
      .where(eq(bookings.id, booked.bookingId));
    const deleted = vi.fn(async () => ok({ deleted: true as const }));
    const workflow = new BankTransferWorkflowUseCase({
      secret: 'audit-synthetic-secret-never-used-for-live-data',
      bankRepo: new DrizzleBankRepository(db),
      authorization,
      imagePort: { sanitize: async (bytes) => ok(bytes) },
      storagePort: {
        uploadPrivateProof: async ({ storageKey }) => ok({ storageKey }),
        deleteProofImmediately: deleted,
        getTemporaryAdminViewUrl: async () => ok({ presignedUrl: 'https://invalid.local' }),
      },
    });
    const input = {
      organizationId: context.organizationId,
      bookingId: booked.bookingId,
      decision: 'APPROVE' as const,
    };
    required(await workflow.reviewByAdmin(input));
    required(await workflow.reviewByAdmin(input));
    expect(deleted).not.toHaveBeenCalled();
    expect((await db.select().from(bookings))[0]?.proofStorageKey).toBe('protected.png');
    expect((await db.select().from(outboxJobs)).filter((j) => j.type === 'PURGE')).toHaveLength(0);
  },
);
it.each(['legalHold', 'disputeOpen'] as const)(
  'refuses manual privacy erasure under %s',
  async (flag) => {
    const context = await fixture();
    const booked = required(await reserve(rawInput(context)));
    await db
      .update(bookings)
      .set({ [flag]: true })
      .where(eq(bookings.id, booked.bookingId));
    const repository = new DrizzleGdprRepository(db);
    expect(
      (await repository.fullyAnonymizeBookingAtomically(context.organizationId, booked.bookingId))
        .ok,
    ).toBe(false);
    expect(
      (await repository.scrubNonAccountingDataAtomically(context.organizationId, booked.bookingId))
        .ok,
    ).toBe(false);
    expect((await db.select().from(bookings))[0]).toMatchObject({
      email: 'test@example.com',
      selfServiceVersion: 0,
    });
  },
);
it('retains fiscal identity for a classified accounting proof even without a recorded payment', async () => {
  const context = await fixture();
  const booked = required(await reserve(rawInput(context)));
  await db
    .update(bookings)
    .set({ proofIsAccounting: true })
    .where(eq(bookings.id, booked.bookingId));
  const repository = new DrizzleGdprRepository(db);
  const outcome = required(
    await new GdprRetentionUseCase({
      gdprRepo: repository,
      authorization,
    }).handleAttendeePrivacyErasureRequest({
      organizationId: context.organizationId,
      bookingId: booked.bookingId,
    }),
  );
  expect(outcome.status).toBe('ACCOUNTING_DATA_RETAINED');
  expect((await db.select().from(bookings))[0]?.firstName).toBe('Test');
  expect(
    (await repository.fullyAnonymizeBookingAtomically(context.organizationId, booked.bookingId)).ok,
  ).toBe(false);
});
