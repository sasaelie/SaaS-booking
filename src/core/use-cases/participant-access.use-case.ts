import type { ParticipantAccessPort } from '../ports/participant-access.port';
import { ParticipantExchangeSchema, ParticipantBookingSchema } from '../validation/participant';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { guardUseCase } from '../../lib/guard-use-case';
export class ParticipantAccessUseCase {
  constructor(private readonly repository: ParticipantAccessPort) {}
  exchange(raw: unknown, browserToken: string | null) {
    return guardUseCase('Participant', 'exchange', async () => {
      const parsed = ParticipantExchangeSchema.safeParse(raw);
      return parsed.success
        ? this.repository.exchange(parsed.data.code, browserToken, new Date())
        : failure(ERROR_CODES.UNAUTHORIZED, 'Participant', 'exchange');
    });
  }
  authorize(browserToken: string, bookingId: string) {
    return guardUseCase('Participant', 'authorize', async () => {
      const parsed = ParticipantBookingSchema.safeParse({ bookingId });
      return parsed.success
        ? this.repository.authorize(browserToken, parsed.data.bookingId, new Date())
        : failure(ERROR_CODES.UNAUTHORIZED, 'Participant', 'authorize');
    });
  }
}
