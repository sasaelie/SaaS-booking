import type { PaymentGatewayPort, InitiatePaymentInput } from '../../core/ports/payment-gateway.port';
import { SIMULATION, simulationPath } from '../../config/simulation';
import { PAYMENT_MODES, ERROR_CODES } from '../../config/constants';
import { ok } from '../../lib/result';
import { failure } from '../../lib/errors';
export class SimulationPaymentAdapter implements PaymentGatewayPort {
  readonly mode = PAYMENT_MODES.STRIPE;
  async initiatePayment(input: InitiatePaymentInput) {
    return ok({
      paymentReference: SIMULATION.REFERENCE_PREFIX + input.bookingId,
      checkoutUrl: `${simulationPath(input.organizationId)}/paiement/${input.bookingId}`,
      expiresAt: input.expiresAt,
    });
  }
  async verifyWebhookAndParse() {
    return failure(ERROR_CODES.UNAUTHORIZED, 'Simulation', 'webhook');
  }
  async refundPayment() {
    return failure(ERROR_CODES.UNAUTHORIZED, 'Simulation', 'external-refund');
  }
}
