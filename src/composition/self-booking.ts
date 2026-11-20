import 'server-only';
import { runtime } from './runtime';
import { DrizzleSelfBookingRepository } from '../adapters/db/drizzle-self-booking.repository';
import { ReadSelfBookingUseCase } from '../core/use-cases/read-self-booking.use-case';
import { ok } from '../lib/result';
import { ParticipantAccessRepository } from '../adapters/db/participant/repository';
import { publicTestEnabled } from '../config/public-test';
export function selfBooking() {
  const app = runtime();
  return app.ok
    ? ok(
        new ReadSelfBookingUseCase(
          new DrizzleSelfBookingRepository(app.value.db),
          app.value.env.SELF_CANCEL_HMAC_SECRET,
          new ParticipantAccessRepository(
            app.value.db,
            app.value.env.SELF_CANCEL_HMAC_SECRET,
            app.value.env.NEXT_PUBLIC_APP_URL,
            publicTestEnabled(app.value.env),
          ),
        ),
      )
    : app;
}
