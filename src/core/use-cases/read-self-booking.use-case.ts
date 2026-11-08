import type { SelfBookingRepositoryPort } from '../ports/self-booking.port';
import { verifySelfCancelToken } from '../domain/self-service-token';
import { BOOKING_STATUSES, PAYMENT_MODES } from '../../config/constants';
import { ok } from '../../lib/result';
import { guardUseCase } from '../../lib/guard-use-case';
export class ReadSelfBookingUseCase {
  constructor(
    private readonly repository: SelfBookingRepositoryPort,
    private readonly secret: string,
  ) {}
  execute(token: string) {
    return guardUseCase('SelfBooking', 'read', async () => {
      const now = new Date();
      const verified = await verifySelfCancelToken(token, this.secret, now);
      if (!verified.ok) return verified;
      const result = await this.repository.read(verified.value);
      if (!result.ok) return result;
      const booking = result.value;
      const pending =
        booking.status === BOOKING_STATUSES.PENDING_PAYMENT ||
        booking.status === BOOKING_STATUSES.PROOF_SUBMITTED;
      return ok({
        participantHue: booking.participantHue ?? null,
        organizationSlug: booking.organizationSlug,
        organizationName: booking.organizationName,
        activityId: booking.activityId,
        activityName: booking.activityName,
        startsAtIso: booking.startsAt.toISOString(),
        timezone: booking.timezone,
        status: booking.status,
        hasProof: booking.hasProof,
        canUploadProof:
          pending &&
          booking.startsAt > now &&
          booking.paymentMode === PAYMENT_MODES.BANK_TRANSFER &&
          booking.lockedUntil !== null &&
          booking.lockedUntil > now,
        canCancel:
          (pending || booking.status === BOOKING_STATUSES.CONFIRMED) && booking.startsAt > now,
      });
    });
  }
}
