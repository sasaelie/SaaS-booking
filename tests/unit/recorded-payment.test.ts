import { describe, expect, it, vi } from 'vitest';
import { RecordedPaymentSchema } from '../../src/core/validation/recorded-payment';
import { RecordedPaymentUseCase } from '../../src/core/use-cases/portal/recorded-payment.use-case';
import { ok } from '../../src/lib/result';
import { failure } from '../../src/lib/errors';
import { ERROR_CODES } from '../../src/config/constants';
const input = {
  organizationId: crypto.randomUUID(),
  bookingId: crypto.randomUUID(),
  amountCents: 2500,
  method: 'CASH',
  reference: 'RECU-1',
  confirmed: true,
};
describe('recorded payments', () => {
  it('requires consent, positive cents, a receipt and a supported method', () => {
    expect(RecordedPaymentSchema.safeParse(input).success).toBe(true);
    for (const change of [
      { confirmed: false },
      { amountCents: 0 },
      { amountCents: 2.5 },
      { reference: ' ' },
      { method: 'STRIPE' },
    ])
      expect(RecordedPaymentSchema.safeParse({ ...input, ...change }).success).toBe(false);
  });
  it('never records an unauthenticated or invalid command', async () => {
    const record = vi.fn(async () => ok(undefined));
    const denied = new RecordedPaymentUseCase(
      { current: async () => failure(ERROR_CODES.UNAUTHORIZED, 'Test', 'identity') },
      { record },
    );
    expect((await denied.execute(input)).ok).toBe(false);
    const allowed = new RecordedPaymentUseCase(
      { current: async () => ok({ id: 'a', name: 'a', email: 'a@example.com' }) },
      { record },
    );
    expect((await allowed.execute({ ...input, confirmed: false })).ok).toBe(false);
    expect(record).not.toHaveBeenCalled();
    expect((await allowed.execute(input)).ok).toBe(true);
    expect(record).toHaveBeenCalledOnce();
  });
});
