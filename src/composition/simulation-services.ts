import type { DrizzlePgDb } from '../adapters/db/client';
import type { PaymentGatewayPort } from '../core/ports/payment-gateway.port';
import { DrizzleActivityRepository } from '../adapters/db/drizzle-activity.repository';
import { DrizzleSessionRepository } from '../adapters/db/drizzle-session.repository';
import { DrizzleVoucherQuoteRepository } from '../adapters/db/drizzle-voucher-quote.repository';
import { DrizzleVoucherRepository } from '../adapters/db/drizzle-voucher.repository';
import { DrizzleSelfBookingRepository } from '../adapters/db/drizzle-self-booking.repository';
import { DrizzlePublicCatalogRepository } from '../adapters/db/drizzle-public-catalog.repository';
import { GetBookingPageUseCase } from '../core/use-cases/get-booking-page.use-case';
import { CreateBookingUseCase } from '../core/use-cases/create-booking.use-case';
import { QuoteVoucherUseCase } from '../core/use-cases/quote-voucher.use-case';
import { ReadSelfBookingUseCase } from '../core/use-cases/read-self-booking.use-case';
import { PublicCatalogUseCase } from '../core/use-cases/portal/public-catalog.use-case';
import { VoucherLifecycleUseCase } from '../core/use-cases/voucher-lifecycle.use-case';
import { verifySelfCancelToken } from '../core/domain/self-service-token';
import { failure } from '../lib/errors';
import { ERROR_CODES } from '../config/constants';
import { ParticipantAccessRepository } from '../adapters/db/participant/repository';
import { signSelfCancelToken } from '../core/domain/self-service-token';
import { ParticipantCodeSchema } from '../core/validation/participant';
export function simulationServices(
  db: DrizzlePgDb,
  organizationId: string,
  secret: string,
  appUrl: string,
  gateway: PaymentGatewayPort,
) {
  const access = new ParticipantAccessRepository(db, secret, appUrl, true);
  return {
    catalog: new PublicCatalogUseCase(new DrizzlePublicCatalogRepository(db)),
    bookingPage: new GetBookingPageUseCase(new DrizzleActivityRepository(db)),
    createBooking: new CreateBookingUseCase({
      sessionRepo: new DrizzleSessionRepository(db, { secret, test: true }),
      paymentGateway: gateway,
      secret,
      appUrl,
    }),
    quote: new QuoteVoucherUseCase(new DrizzleVoucherQuoteRepository(db, { secret, test: true })),
    selfBooking: new ReadSelfBookingUseCase(new DrizzleSelfBookingRepository(db), secret, access),
    cancellation: new VoucherLifecycleUseCase({
      voucherRepo: new DrizzleVoucherRepository(db),
      secret,
      authorization: {
        async authorizeOrganizationAdmin() {
          return failure(ERROR_CODES.UNAUTHORIZED, 'Simulation', 'administrator');
        },
      },
    }),
    ...simulationTokenServices(access, secret, organizationId),
  };
}

function simulationTokenServices(
  access: ParticipantAccessRepository,
  secret: string,
  organizationId: string,
) {
  return {
    async verify(token: string) {
      const parsed = ParticipantCodeSchema.safeParse(token).success
        ? await access.authorizeCode(token, new Date())
        : await verifySelfCancelToken(token, secret, new Date());
      return parsed.ok && parsed.value.organizationId !== organizationId
        ? failure(ERROR_CODES.UNAUTHORIZED, 'Simulation', 'token-tenant')
        : parsed;
    },
    async managementToken(payload: Parameters<typeof signSelfCancelToken>[0]) {
      return signSelfCancelToken(payload, secret);
    },
  };
}
