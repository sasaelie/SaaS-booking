import 'server-only';
import { runtime } from './runtime';
import { simulationRuntime } from './simulation-runtime';
import { ParticipantAccessRepository } from '../adapters/db/participant/repository';
import { DrizzleSelfBookingRepository } from '../adapters/db/drizzle-self-booking.repository';
import { DrizzleVoucherRepository } from '../adapters/db/drizzle-voucher.repository';
import { ReadSelfBookingUseCase } from '../core/use-cases/read-self-booking.use-case';
import { VoucherLifecycleUseCase } from '../core/use-cases/voucher-lifecycle.use-case';
import { SimulationParticipantUseCase } from '../core/use-cases/simulation-participant.use-case';
import { failure } from '../lib/errors';
import { ok } from '../lib/result';
import { ERROR_CODES } from '../config/constants';
export function simulationParticipant() {
  const app = runtime();
  if (!app.ok) return app;
  const { db, secret } = simulationRuntime(app.value.env);
  const access = new ParticipantAccessRepository(
    db,
    secret,
    app.value.env.NEXT_PUBLIC_APP_URL,
    true,
  );
  return ok({
    appUrl: app.value.env.NEXT_PUBLIC_APP_URL,
    limiter: app.value.limiter,
    operations: new SimulationParticipantUseCase(
      new ReadSelfBookingUseCase(new DrizzleSelfBookingRepository(db), secret, access),
      new VoucherLifecycleUseCase({
        voucherRepo: new DrizzleVoucherRepository(db),
        secret,
        authorization: {
          async authorizeOrganizationAdmin() {
            return failure(ERROR_CODES.UNAUTHORIZED, 'SimulationParticipant', 'administrator');
          },
        },
      }),
    ),
  });
}
