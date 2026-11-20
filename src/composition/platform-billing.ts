import 'server-only';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import Stripe from 'stripe';
import type { Runtime } from './runtime';
import type { PortalIdentityPort } from '../core/ports/portal-identity.port';
import { PlatformBillingUseCase } from '../core/use-cases/portal/platform-billing.use-case';
import { DrizzlePlatformBillingRepository } from '../adapters/db/drizzle-platform-billing.repository';
import { PlatformInvoicePdfAdapter } from '../adapters/accounting/platform-invoice-pdf.adapter';
import { StripePlatformInvoiceAdapter } from '../adapters/payments/stripe-platform-invoice.adapter';
import { paymentsEnabled } from '../config/staging';
import { SAAS } from '../config/constants';
export function platformBilling(app: Runtime, identity: PortalIdentityPort) {
  const pdf = new PlatformInvoicePdfAdapter(
    async () =>
      new Uint8Array(await readFile(path.join(process.cwd(), 'public/fonts/DejaVuSans.ttf'))),
    app.env.APP_ENVIRONMENT === 'staging',
  );
  const stripe =
    paymentsEnabled(app.env) && app.env.STRIPE_SECRET_KEY
      ? new Stripe(app.env.STRIPE_SECRET_KEY, {
          timeout: SAAS.PROVIDER_TIMEOUT_MS,
          maxNetworkRetries: 1,
        })
      : null;
  return new PlatformBillingUseCase(
    identity,
    new DrizzlePlatformBillingRepository(app.db, pdf),
    new StripePlatformInvoiceAdapter(stripe),
    stripe !== null,
  );
}
