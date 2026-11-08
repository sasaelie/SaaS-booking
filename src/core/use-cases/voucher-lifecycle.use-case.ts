import { guardUseCase } from '../../lib/guard-use-case';
import { INPUT_LIMITS } from '../../config/constants';

import type { Result } from '../../lib/result';
import {
  generateFormattedVoucherCode,
  type RescheduleVoucherSnapshot,
} from '../domain/voucher-engine';
import { verifySelfCancelToken } from '../domain/self-service-token';
import type { VoucherRepositoryPort, CancelByAttendeeOutput } from '../ports/voucher.port';
import type { AuthorizationPort } from '../ports/authorization.port';
export interface VoucherLifecycleDeps {
  readonly voucherRepo: VoucherRepositoryPort;
  readonly authorization: AuthorizationPort;
  readonly secret: string;
  readonly nowProvider?: () => Date;
  readonly randomBytesProvider?: (length: number) => Uint8Array;
}
export class VoucherLifecycleUseCase {
  constructor(private readonly deps: VoucherLifecycleDeps) {}
  async cancelByAttendee(input: {
    readonly token: string;
  }): Promise<Result<CancelByAttendeeOutput>> {
    return guardUseCase('voucher-lifecycle.use-case.ts', 'cancelByAttendee', async () => {
      const now = this.deps.nowProvider?.() ?? new Date();
      const payload = await verifySelfCancelToken(input.token, this.deps.secret, now);
      if (!payload.ok) return payload;
      return this.cancel({ ...payload.value, adminOverride: false }, now);
    });
  }
  async cancelByAdministrator(input: {
    readonly organizationId: string;
    readonly bookingId: string;
    readonly adminOverride: boolean;
  }): Promise<Result<CancelByAttendeeOutput>> {
    return guardUseCase('voucher-lifecycle.use-case.ts', 'cancelByAdministrator', async () => {
      const auth = await this.deps.authorization.authorizeOrganizationAdmin(input.organizationId);
      if (!auth.ok) return auth;
      return this.cancel({ ...input, version: null }, this.deps.nowProvider?.() ?? new Date());
    });
  }
  private async cancel(
    input: {
      readonly organizationId: string;
      readonly bookingId: string;
      readonly version: number | null;
      readonly adminOverride: boolean;
    },
    now: Date,
  ): Promise<Result<CancelByAttendeeOutput>> {
    const bytes =
      this.deps.randomBytesProvider?.(INPUT_LIMITS.HASH_LENGTH) ??
      crypto.getRandomValues(new Uint8Array(INPUT_LIMITS.HASH_LENGTH));
    const code = generateFormattedVoucherCode(bytes);
    if (!code.ok) return code;
    return this.deps.voucherRepo.cancelBookingAtomically({
      ...input,
      code: code.value,
      now,
    });
  }
  async redeemForOnlineCourse(input: {
    readonly organizationId: string;
    readonly code: string;
  }): Promise<Result<RescheduleVoucherSnapshot>> {
    return guardUseCase('voucher-lifecycle.use-case.ts', 'redeemForOnlineCourse', async () => {
      const auth = await this.deps.authorization.authorizeOrganizationAdmin(input.organizationId);
      if (!auth.ok) return auth;
      return this.deps.voucherRepo.redeemVoucherForExternalBenefitAtomically({
        ...input,
        code: input.code.trim().toUpperCase(),
        now: this.deps.nowProvider?.() ?? new Date(),
      });
    });
  }
}
