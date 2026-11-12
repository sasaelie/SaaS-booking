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
export function simulationServices(
  db: DrizzlePgDb,
  organizationId: string,
  secret: string,
  appUrl: string,
  gateway: PaymentGatewayPort,
) {
  return {
    catalog: new PublicCatalogUseCase(new DrizzlePublicCatalogRepository(db)),
    bookingPage: new GetBookingPageUseCase(new DrizzleActivityRepository(db)),
    createBooking: new CreateBookingUseCase({
      sessionRepo: new DrizzleSessionRepository(db),
      paymentGateway: gateway,
      secret,
      appUrl,
    }),
    quote: new QuoteVoucherUseCase(new DrizzleVoucherQuoteRepository(db)),
    selfBooking: new ReadSelfBookingUseCase(new DrizzleSelfBookingRepository(db), secret),
    cancellation: new VoucherLifecycleUseCase({
      voucherRepo: new DrizzleVoucherRepository(db),
      secret,
      authorization: {
        async authorizeOrganizationAdmin() {
          return failure(ERROR_CODES.UNAUTHORIZED, 'Simulation', 'administrator');
        },
      },
    }),
    async verify(token: string) {
      const parsed = await verifySelfCancelToken(token, secret, new Date());
      return parsed.ok && parsed.value.organizationId !== organizationId
        ? failure(ERROR_CODES.UNAUTHORIZED, 'Simulation', 'token-tenant')
        : parsed;
    },
  };
}
