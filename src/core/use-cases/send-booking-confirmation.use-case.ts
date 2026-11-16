import { BookingNotificationSchema } from '../validation/booking-notification';
import type { JobRunnerPort } from '../ports/jobs.port';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
import { guardUseCase } from '../../lib/guard-use-case';
export class SendBookingConfirmationUseCase {
  constructor(private readonly runner: JobRunnerPort) {}
  execute(raw: unknown) {
    return guardUseCase('BookingConfirmation', 'send', async () => {
      const scope = BookingNotificationSchema.safeParse(raw);
      return scope.success
        ? this.runner.runConfirmation(scope.data.organizationId, scope.data.bookingId)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'BookingConfirmation', 'input');
    });
  }
}
