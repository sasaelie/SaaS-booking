import type { Result } from '../../lib/result';
import type { RescheduleVoucherSnapshot } from '../domain/voucher-engine';
export interface CancelByAttendeeOutput {
  readonly bookingCancelled: true;
  readonly voucherIssued: boolean;
  readonly voucher: RescheduleVoucherSnapshot | null;
}
export interface CancellationInput {
  readonly organizationId: string;
  readonly bookingId: string;
  readonly version: number | null;
  readonly adminOverride: boolean;
  readonly code: string;
  readonly now: Date;
}
export interface VoucherRepositoryPort {
  cancelBookingAtomically(input: CancellationInput): Promise<Result<CancelByAttendeeOutput>>;
  redeemVoucherForExternalBenefitAtomically(input: {
    readonly organizationId: string;
    readonly code: string;
    readonly now: Date;
  }): Promise<Result<RescheduleVoucherSnapshot>>;
}
