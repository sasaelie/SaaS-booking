import type Stripe from 'stripe';
import type { PlatformInvoiceProviderPort } from '../../core/ports/platform-billing';
import { guardUseCase } from '../../lib/guard-use-case';
import { failure } from '../../lib/errors';
import { ok } from '../../lib/result';
import { ERROR_CODES } from '../../config/constants';
export class StripePlatformInvoiceAdapter implements PlatformInvoiceProviderPort {
  constructor(private readonly stripe: Stripe | null) {}
  original(invoiceId: string, customerId: string) {
    return guardUseCase('PlatformInvoice', 'provider', async () => {
      if (!this.stripe)
        return failure(ERROR_CODES.CONFIGURATION_ERROR, 'PlatformInvoice', 'provider');
      const invoice = await this.stripe.invoices.retrieve(invoiceId);
      const customer =
        typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (
        customer !== customerId ||
        invoice.status !== 'paid' ||
        invoice.currency !== 'eur' ||
        !invoice.invoice_pdf
      )
        return failure(ERROR_CODES.UNAUTHORIZED, 'PlatformInvoice', 'provider-scope');
      const url = new URL(invoice.invoice_pdf);
      if (
        url.protocol !== 'https:' ||
        !(url.hostname === 'stripe.com' || url.hostname.endsWith('.stripe.com'))
      )
        return failure(ERROR_CODES.PAYMENT_PROVIDER_ERROR, 'PlatformInvoice', 'provider-url');
      return ok(url.toString());
    });
  }
}
