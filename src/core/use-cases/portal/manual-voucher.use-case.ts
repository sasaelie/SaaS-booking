import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { PortalRepositoryPort } from '../../ports/portal-repository.port';
import { ManualVoucherSchema } from '../../validation/manual-voucher';
import { withPortalActor } from './actor';
import { failure } from '../../../lib/errors';
import { ERROR_CODES } from '../../../config/constants';
export class ManualVoucherUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: PortalRepositoryPort,
  ) {}
  issue(raw: unknown) {
    return withPortalActor(this.identity, 'ManualVoucher', async (actor) => {
      const input = ManualVoucherSchema.safeParse(raw);
      return input.success
        ? this.repository.issueManualVoucher(actor, input.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'ManualVoucher', 'input');
    });
  }
}
