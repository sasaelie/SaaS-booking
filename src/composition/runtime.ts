import { DrizzleVoucherQuoteRepository } from '../adapters/db/drizzle-voucher-quote.repository';
import { QuoteVoucherUseCase } from '../core/use-cases/quote-voucher.use-case';
import 'server-only';
import { readEnvironment } from '../config/env';
import { ok } from '../lib/result';
import { createDatabase } from '../adapters/db/client';
import { DrizzleActivityRepository } from '../adapters/db/drizzle-activity.repository';
import { DrizzlePaymentRepository } from '../adapters/db/drizzle-payment.repository';
import { DrizzleJobRunner } from '../adapters/db/jobs/runner';
import { ProductionJobHandler } from '../adapters/jobs/handler';
import { DrizzleRateLimit } from '../adapters/db/drizzle-rate-limit';
import { bookingCreation } from './booking-creation';
import { GetBookingPageUseCase } from '../core/use-cases/get-booking-page.use-case';
import { HandlePaymentWebhookUseCase } from '../core/use-cases/handle-stripe-webhook.use-case';
import { providers } from './providers';
import { PostgresProofStorageAdapter } from '../adapters/storage/postgres-proof.adapter';
import { PrivateFileTokenAdapter } from '../adapters/storage/private-file-token.adapter';
import { publicTestEnabled } from '../config/public-test';
function assemble(env: Extract<ReturnType<typeof readEnvironment>, { ok: true }>['value']) {
  const { db, pool } = createDatabase(env.DATABASE_URL, env.DATABASE_SCHEMA, env.DATABASE_SSL_CA);
  const services = applicationProviders(env, db);
  const code = {
    secret: env.SELF_CANCEL_HMAC_SECRET,
    test: publicTestEnabled(env),
    skipNotifications: publicTestEnabled(env),
  };
  const handler = new ProductionJobHandler({
    db,
    gateway: services.gateway,
    storage: services.storage,
    resend: services.resend,
    mailFrom: env.MAIL_FROM ?? null,
    appUrl: env.NEXT_PUBLIC_APP_URL,
    secret: env.SELF_CANCEL_HMAC_SECRET,
  });
  return {
    voucherQuote: new QuoteVoucherUseCase(new DrizzleVoucherQuoteRepository(db, code)),
    db,
    pool,
    env,
    services,
    runner: new DrizzleJobRunner(db, handler),
    limiter: new DrizzleRateLimit(db),
    createBooking: bookingCreation(db, env, services.gateway),
    bookingPage: new GetBookingPageUseCase(new DrizzleActivityRepository(db), code.test),
    webhook: new HandlePaymentWebhookUseCase({
      paymentGateway: services.gateway,
      paymentRepo: new DrizzlePaymentRepository(db),
    }),
  };
}
function applicationProviders(
  env: Extract<ReturnType<typeof readEnvironment>, { ok: true }>['value'],
  db: ReturnType<typeof createDatabase>['db'],
) {
  const services = providers(env);
  return env.STORAGE_BACKEND === 'postgres'
    ? {
        ...services,
        storage: new PostgresProofStorageAdapter(
          db,
          new PrivateFileTokenAdapter(env.SELF_CANCEL_HMAC_SECRET),
          env.NEXT_PUBLIC_APP_URL,
        ),
      }
    : services;
}
export type Runtime = ReturnType<typeof assemble>;
let instance: Runtime | undefined;
export function runtime() {
  if (instance) return ok(instance);
  const env = readEnvironment();
  if (!env.ok) return env;
  instance = assemble(env.value);
  return ok(instance);
}
