import type { CreateBookingOutput } from './create-booking.use-case';
import type { SimulationRepositoryPort } from '../ports/simulation.port';
import { BOOKING_STATUSES } from '../../config/constants';
import { guardUseCase } from '../../lib/guard-use-case';
import { ok, type Result } from '../../lib/result';
interface BookingCreator {
  execute(raw: unknown): Promise<Result<CreateBookingOutput>>;
}
export class SimulatedBookingPaymentUseCase {
  constructor(
    private readonly creator: BookingCreator,
    private readonly simulator: Pick<SimulationRepositoryPort, 'payment'>,
  ) {}
  execute(raw: unknown): Promise<Result<CreateBookingOutput>> {
    return guardUseCase('SimulatedBookingPayment', 'execute', async () => {
      const result = await this.creator.execute(raw);
      if (!result.ok || !result.value.checkoutUrl) return result;
      const booking = result.value;
      if (booking.status === BOOKING_STATUSES.PENDING_PAYMENT) {
        const paid = await this.simulator.payment(booking.bookingId, true);
        if (!paid.ok) return paid;
      } else if (booking.status !== BOOKING_STATUSES.CONFIRMED) return result;
      return ok({
        ...booking,
        status: BOOKING_STATUSES.CONFIRMED,
        amountToPayCents: 0,
        lockedUntil: null,
        checkoutUrl: null,
        paymentSimulated: true,
      });
    });
  }
}
