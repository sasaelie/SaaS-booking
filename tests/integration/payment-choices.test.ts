import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { ownerOf } from './service-voucher-fixtures';
import { required } from '../../src/adapters/db/transaction';
import { bookings, rescheduleVouchers, financialEntries } from '../../src/adapters/db/schema';
import { DrizzleBankRepository } from '../../src/adapters/db/drizzle-bank.repository';
import { DrizzleRecordedPaymentRepository } from '../../src/adapters/db/drizzle-recorded-payment.repository';
import { RecordedPaymentSchema } from '../../src/core/validation/recorded-payment';

it.each(['BANK_TRANSFER', 'NONE'] as const)('keeps %s for a partial voucher', async (mode) => {
  const context = await fixture(mode);
  const origin = required(await reserve(rawInput(context)));
  const [voucher] = await db
    .insert(rescheduleVouchers)
    .values({
      organizationId: context.organizationId,
      originBookingId: origin.bookingId,
      originActivityId: context.activityId,
      code: 'RPT-ABCD-EFGH',
      initialValueCents: 1000,
      currency: 'EUR',
      expiresAt: new Date(Date.now() + 86400000),
    })
    .returning();
  expect(voucher).toBeDefined();
  const booking = required(await reserve({ ...rawInput(context), voucherCode: voucher?.code }));
  expect(booking.paymentMode).toBe(mode);
  expect(booking.amountToPayCents).toBe(2000);
  if (mode === 'BANK_TRANSFER') {
    required(
      await new DrizzleBankRepository(db).finalizeAdminBankDecisionAtomically({
        organizationId: context.organizationId,
        bookingId: booking.bookingId,
        decision: 'APPROVE',
        reference: 'STATEMENT-1',
        now: new Date(),
      }),
    );
  }
  const [used] = await db.select().from(rescheduleVouchers);
  expect(used?.status).toBe('USED_FOR_BOOKING');
  expect(used?.lockedBookingId).toBeNull();
});

it('requires a bank reference without a screenshot and makes approval idempotent', async () => {
  const context = await fixture('BANK_TRANSFER');
  const booking = required(await reserve(rawInput(context)));
  const repository = new DrizzleBankRepository(db);
  const input = {
    organizationId: context.organizationId,
    bookingId: booking.bookingId,
    decision: 'APPROVE' as const,
    now: new Date(),
  };
  expect((await repository.finalizeAdminBankDecisionAtomically(input)).ok).toBe(false);
  required(await repository.finalizeAdminBankDecisionAtomically({ ...input, reference: 'BANK-1' }));
  required(await repository.finalizeAdminBankDecisionAtomically({ ...input, reference: 'BANK-1' }));
  const [paid] = await db.select().from(bookings).where(eq(bookings.id, booking.bookingId));
  expect(paid?.amountPaidCents).toBe(3000);
  expect(
    (await db.select().from(financialEntries)).filter((e) => e.kind === 'PAYMENT'),
  ).toHaveLength(1);
});

it('records a full offline payment once with its actor and receipt', async () => {
  const context = await fixture();
  const booking = required(await reserve(rawInput(context)));
  const { actor } = await ownerOf(context.organizationId);
  const repository = new DrizzleRecordedPaymentRepository(db);
  const input = RecordedPaymentSchema.parse({
    organizationId: context.organizationId,
    bookingId: booking.bookingId,
    amountCents: 3000,
    method: 'CASH',
    reference: 'RECU-1',
    confirmed: true,
  });
  const results = await Promise.all(
    Array.from({ length: 4 }, () => repository.record(actor, input)),
  );
  expect(results.every((result) => result.ok)).toBe(true);
  const [paid] = await db.select().from(bookings).where(eq(bookings.id, booking.bookingId));
  expect(paid?.amountPaidCents).toBe(3000);
  const entries = (await db.select().from(financialEntries)).filter((e) => e.kind === 'PAYMENT');
  expect(entries).toHaveLength(1);
  expect(entries[0]?.reference).toBe('CASH:RECU-1');
  expect((await repository.record({ ...actor, id: crypto.randomUUID() }, input)).ok).toBe(false);
  expect((await repository.record(actor, { ...input, reference: 'DIFFERENT' })).ok).toBe(false);
});

it.each(['STRIPE', 'BANK_TRANSFER'] as const)('cannot manually bypass %s', async (mode) => {
  const context = await fixture(mode);
  const booking = required(await reserve(rawInput(context)));
  const { actor } = await ownerOf(context.organizationId);
  const result = await new DrizzleRecordedPaymentRepository(db).record(
    actor,
    RecordedPaymentSchema.parse({
      organizationId: context.organizationId,
      bookingId: booking.bookingId,
      amountCents: 3000,
      method: 'CASH',
      reference: 'R',
      confirmed: true,
    }),
  );
  expect(result.ok).toBe(false);
  expect((await db.select().from(bookings))[0]?.amountPaidCents).toBe(0);
});
