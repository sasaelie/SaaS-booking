import { expect, it } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { fixture, rawInput, reserve } from './fixtures';
import { bookings, outboxJobs, sessions } from '../../src/adapters/db/schema';
import { DrizzlePaymentRepository } from '../../src/adapters/db/drizzle-payment.repository';
import { required } from '../../src/adapters/db/transaction';
import { PAYMENT_MODES, BOOKING_STATUSES, JOB_TYPES } from '../../src/config/constants';
import type { ParsedWebhookPaymentEvent } from '../../src/core/ports/payment-gateway.port';
async function paidFixture() {
  const context = await fixture(PAYMENT_MODES.STRIPE);
  const booking = required(await reserve(rawInput(context)));
  return { context, booking };
}
function event(input: Awaited<ReturnType<typeof paidFixture>>): ParsedWebhookPaymentEvent {
  return {
    eventId: crypto.randomUUID(),
    provider: PAYMENT_MODES.STRIPE,
    bookingId: input.booking.bookingId,
    organizationId: input.context.organizationId,
    paymentReference: 'pi_test',
    checkoutReference: 'cs_test',
    amountPaidCents: 3000,
    currency: 'EUR',
    merchantAccountId: null,
  };
}
it('confirms once for duplicate and semantically duplicate payment events', async () => {
  const input = await paidFixture();
  const payload = event(input);
  const repository = new DrizzlePaymentRepository(db);
  expect((await repository.confirmPaymentOrDetectCollisionAtomically(payload, new Date())).ok).toBe(
    true,
  );
  await repository.confirmPaymentOrDetectCollisionAtomically(payload, new Date());
  await repository.confirmPaymentOrDetectCollisionAtomically(
    { ...payload, eventId: crypto.randomUUID() },
    new Date(),
  );
  const [booking] = await db.select().from(bookings);
  expect(booking?.status).toBe(BOOKING_STATUSES.CONFIRMED);
  expect(booking?.amountPaidCents).toBe(3000);
  expect(await db.select().from(outboxJobs)).toHaveLength(1);
});
it('rejects a signed payment whose amount or currency disagrees with the booking', async () => {
  const input = await paidFixture();
  const repository = new DrizzlePaymentRepository(db);
  const payload = event(input);
  expect(
    (
      await repository.confirmPaymentOrDetectCollisionAtomically(
        { ...payload, amountPaidCents: 1 },
        new Date(),
      )
    ).ok,
  ).toBe(false);
  expect(
    (
      await repository.confirmPaymentOrDetectCollisionAtomically(
        { ...payload, currency: 'USD' },
        new Date(),
      )
    ).ok,
  ).toBe(false);
});
it('queues a durable refund instead of confirming a late payment on a cancelled session', async () => {
  const input = await paidFixture();
  await db
    .update(sessions)
    .set({ isCancelled: true })
    .where(eq(sessions.id, input.booking.sessionId));
  const repository = new DrizzlePaymentRepository(db);
  const payload = event(input);
  const result = required(
    await repository.confirmPaymentOrDetectCollisionAtomically(payload, new Date()),
  );
  expect(result.status).toBe('REFUND_QUEUED');
  await repository.confirmPaymentOrDetectCollisionAtomically(payload, new Date());
  const jobs = await db.select().from(outboxJobs);
  expect(jobs).toHaveLength(1);
  expect(jobs[0]?.type).toBe(JOB_TYPES.REFUND);
});
