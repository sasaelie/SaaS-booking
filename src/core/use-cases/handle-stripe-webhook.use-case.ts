import { guardUseCase } from '../../lib/guard-use-case';
import { ok, type Result } from '../../lib/result';

import type {
  PaymentGatewayPort,
  BookingPaymentRepositoryPort,
} from '../ports/payment-gateway.port';
export interface HandlePaymentWebhookDeps {
  readonly paymentGateway: PaymentGatewayPort;
  readonly paymentRepo: BookingPaymentRepositoryPort;
  readonly nowProvider?: () => Date;
}
export class HandlePaymentWebhookUseCase {
  constructor(private readonly deps: HandlePaymentWebhookDeps) {}
  async execute(
    body: string,
    signature: string,
  ): Promise<Result<{ readonly status: string; readonly bookingId: string | null }>> {
    return guardUseCase('handle-stripe-webhook.use-case.ts', 'execute', async () => {
      const parsed = await this.deps.paymentGateway.verifyWebhookAndParse(body, signature);
      if (!parsed.ok) return parsed;
      if (!parsed.value) return ok({ status: 'IGNORED_EVENT_TYPE', bookingId: null });
      return this.deps.paymentRepo.confirmPaymentOrDetectCollisionAtomically(
        parsed.value,
        this.deps.nowProvider?.() ?? new Date(),
      );
    });
  }
}
