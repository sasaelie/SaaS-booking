import { expect, it, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { db } from './database';
import { paidBooking } from './lifecycle-fixtures';
import { bookings, outboxJobs, financialEntries } from '../../src/adapters/db/schema';
import { DrizzleJobRunner } from '../../src/adapters/db/jobs/runner';
import { ProductionJobHandler } from '../../src/adapters/jobs/handler';
import type { PaymentGatewayPort } from '../../src/core/ports/payment-gateway.port';
import type { RefundState } from '../../src/config/refunds';
import { ok } from '../../src/lib/result';
import { required } from '../../src/adapters/db/transaction';
async function scenario() {
  const input = await paidBooking();
  const refundId = 're_audit';
  const reference = `pi_${input.booking.bookingId}`;
  await db.delete(outboxJobs);
  await db
    .update(bookings)
    .set({ refundStatus: 'PENDING' })
    .where(eq(bookings.id, input.booking.bookingId));
  await db.insert(outboxJobs).values({
    organizationId: input.context.organizationId,
    type: 'REFUND',
    deduplicationKey: 'audit:refund',
    payload: {
      bookingId: input.booking.bookingId,
      paymentReference: reference,
      amountCents: 3000,
      merchantAccountId: null,
      idempotencyKey: 'audit:refund',
    },
  });
  const refund = vi.fn<PaymentGatewayPort['refundPayment']>();
  const runner = createRunner(refund);
  const respond = (status: RefundState) => refund.mockResolvedValue(ok({ refundId, status }));
  return { runner, refund, respond, refundId };
}
function createRunner(refund: PaymentGatewayPort['refundPayment']) {
  const gateway: PaymentGatewayPort = {
    mode: 'STRIPE',
    refundPayment: refund,
    initiatePayment: async () => {
      throw Error('Not a checkout test');
    },
    verifyWebhookAndParse: async () => ok(null),
  };
  return new DrizzleJobRunner(
    db,
    new ProductionJobHandler({
      db,
      gateway,
      storage: {
        uploadPrivateProof: async ({ storageKey }) => ok({ storageKey }),
        getTemporaryAdminViewUrl: async () => ok({ presignedUrl: '' }),
        deleteProofImmediately: async () => ok({ deleted: true }),
      },
      resend: null,
      mailFrom: null,
      appUrl: 'http://127.0.0.1',
      secret: 'audit-only-no-real-effects',
    }),
  );
}
it('keeps a pending refund durable, resumes its identifier and records success only once', async () => {
  const { runner, refund, respond, refundId } = await scenario();
  respond('PENDING');
  required(await runner.runBatch());
  const [waiting] = await db.select().from(outboxJobs);
  expect(waiting).toMatchObject({
    completedAt: null,
    payload: expect.objectContaining({ refundId, firstAttemptAt: expect.any(String) }),
  });
  expect((await db.select().from(bookings))[0]?.refundStatus).toBe('PENDING');
  expect(
    (await db.select().from(financialEntries)).filter((e) => e.kind === 'REFUND'),
  ).toHaveLength(0);
  await db.update(outboxJobs).set({ availableAt: new Date(0) });
  respond('SUCCEEDED');
  required(await runner.runBatch());
  expect(refund.mock.calls[1]?.[0]).toMatchObject({ refundId });
  expect((await db.select().from(bookings))[0]?.refundStatus).toBe('REFUNDED');
  required(await runner.runBatch());
  expect(refund).toHaveBeenCalledTimes(2);
  expect(
    (await db.select().from(financialEntries)).filter((e) => e.kind === 'REFUND'),
  ).toHaveLength(1);
});
it('keeps a failed refund visible and never books it as paid back', async () => {
  const { runner, respond } = await scenario();
  respond('FAILED');
  required(await runner.runBatch());
  expect((await db.select().from(bookings))[0]?.refundStatus).toBe('PENDING');
  expect((await db.select().from(outboxJobs))[0]).toMatchObject({
    completedAt: null,
    lastError: 'PAYMENT_PROVIDER_ERROR',
    payload: expect.objectContaining({ refundStatus: 'FAILED' }),
  });
  expect(
    (await db.select().from(financialEntries)).filter((e) => e.kind === 'REFUND'),
  ).toHaveLength(0);
});
