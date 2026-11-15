import type { Result } from '../../lib/result';
import type { SelfCancelTokenPayload } from '../validation/self-service';
import type { ParticipantTicket } from '../validation/participant';
export interface BookingCredential {
  readonly id: string;
  readonly organizationId: string;
  readonly bookingId: string;
  readonly version: number;
}
export interface ParticipantAccessPort {
  authorizeCode(code: string, now: Date): Promise<Result<SelfCancelTokenPayload>>;
  exchange(
    code: string,
    browserToken: string | null,
    now: Date,
  ): Promise<
    Result<{
      readonly browserToken: string;
      readonly bookingId: string;
    }>
  >;
  authorize(
    browserToken: string,
    bookingId: string,
    now: Date,
  ): Promise<Result<SelfCancelTokenPayload>>;
  ticket(payload: SelfCancelTokenPayload, now: Date): Promise<Result<ParticipantTicket | null>>;
  resolveVoucher(code: string, organizationId: string, now: Date): Promise<Result<string>>;
}
