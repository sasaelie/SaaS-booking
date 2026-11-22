import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { RecordedPaymentPort } from '../../ports/recorded-payment.port';
import { RecordedPaymentSchema } from '../../validation/recorded-payment';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { withPortalActor } from './actor';
export class RecordedPaymentUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: RecordedPaymentPort,
  ) {}
  execute(raw: unknown) {
    return withPortalActor(this.identity, 'RecordedPayment', (actor) => {
      const input = RecordedPaymentSchema.safeParse(raw);
      return input.success
        ? this.repository.record(actor, input.data)
        : Promise.resolve(failure(ERROR_CODES.VALIDATION_FAILED, 'RecordedPayment', 'input'));
    });
  }
}
