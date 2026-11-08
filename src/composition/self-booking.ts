import 'server-only';
import { runtime } from './runtime';
import { DrizzleSelfBookingRepository } from '../adapters/db/drizzle-self-booking.repository';
import { ReadSelfBookingUseCase } from '../core/use-cases/read-self-booking.use-case';
import { ok } from '../lib/result';
export function selfBooking() {
  const app = runtime();
  return app.ok
    ? ok(
        new ReadSelfBookingUseCase(
          new DrizzleSelfBookingRepository(app.value.db),
          app.value.env.SELF_CANCEL_HMAC_SECRET,
        ),
      )
    : app;
}
