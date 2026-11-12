import { expect, it, vi } from 'vitest';
import { SimulationUseCase } from '../../src/core/use-cases/simulation.use-case';
import { SimulationPaymentAdapter } from '../../src/adapters/simulation/payment.adapter';
import { ok } from '../../src/lib/result';
import { required } from '../../src/adapters/db/transaction';
import type { SimulationRepositoryPort } from '../../src/core/ports/simulation.port';
it('rejects malformed test payment and delete commands before persistence', async () => {
  const repo: SimulationRepositoryPort = {
    count: vi.fn(async () => ok(0)),
    list: vi.fn(async () => ok([])),
    payment: vi.fn(async () => ok(undefined)),
    delete: vi.fn(async () => ok(undefined)),
  };
  const service = new SimulationUseCase(repo);
  expect((await service.payment({ bookingId: 'wrong', success: true })).ok).toBe(false);
  expect((await service.delete({ bookingId: 'wrong' })).ok).toBe(false);
  expect(repo.payment).not.toHaveBeenCalled();
  expect(repo.delete).not.toHaveBeenCalled();
});
it('never opens an external checkout or accepts a provider webhook in the simulator', async () => {
  const gateway = new SimulationPaymentAdapter();
  const result = required(
    await gateway.initiatePayment({
      organizationId: 'org',
      bookingId: 'booking',
      activityName: 'Atelier',
      amountCents: 3000,
      currency: 'EUR',
      customerEmail: 'test@example.invalid',
      expiresAt: new Date(),
      successUrl: 'https://example.com',
      cancelUrl: 'https://example.com',
      merchantAccountId: null,
    }),
  );
  expect(result.checkoutUrl).toBe('/simulation/org/paiement/booking');
  expect((await gateway.verifyWebhookAndParse()).ok).toBe(false);
  expect((await gateway.refundPayment()).ok).toBe(false);
});
