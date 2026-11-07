import { ERROR_CODES, PAYMENT_MODES } from '../config/constants';
import { failure } from '../lib/errors';
import type { PaymentGatewayPort } from '../core/ports/payment-gateway.port';
import type { PrivateProofStoragePort } from '../core/ports/bank.port';
const unavailable = () =>
  Promise.resolve(failure(ERROR_CODES.CONFIGURATION_ERROR, 'Configuration', 'service'));
export const unavailablePayment: PaymentGatewayPort = {
  mode: PAYMENT_MODES.STRIPE,
  initiatePayment: unavailable,
  verifyWebhookAndParse: unavailable,
  refundPayment: unavailable,
};
export const unavailableStorage: PrivateProofStoragePort = {
  uploadPrivateProof: unavailable,
  getTemporaryAdminViewUrl: unavailable,
  deleteProofImmediately: unavailable,
};
