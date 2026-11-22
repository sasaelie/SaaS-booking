import type { Environment } from '../config/env';
import type { DrizzlePgDb } from '../adapters/db/client';
import type { PaymentGatewayPort } from '../core/ports/payment-gateway.port';
import { DrizzleSessionRepository } from '../adapters/db/drizzle-session.repository';
import { PublicTestPaymentRepository } from '../adapters/simulation/public-test-payment.repository';
import { CreateBookingUseCase } from '../core/use-cases/create-booking.use-case';
import { SimulatedBookingPaymentUseCase } from '../core/use-cases/simulated-booking-payment.use-case';
import { publicTestEnabled } from '../config/public-test';
export function bookingCreation(db: DrizzlePgDb, env: Environment, gateway: PaymentGatewayPort) {
  const test = publicTestEnabled(env);
  const creator = new CreateBookingUseCase({
    sessionRepo: new DrizzleSessionRepository(db, {
      secret: env.SELF_CANCEL_HMAC_SECRET,
      test,
      skipNotifications: test,
    }),
    paymentGateway: gateway,
    secret: env.SELF_CANCEL_HMAC_SECRET,
    appUrl: env.NEXT_PUBLIC_APP_URL,
  });
  return test
    ? new SimulatedBookingPaymentUseCase(creator, new PublicTestPaymentRepository(db))
    : creator;
}
