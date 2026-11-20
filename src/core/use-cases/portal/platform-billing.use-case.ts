import { z } from 'zod';
import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type {
  PlatformBillingRepositoryPort,
  PlatformInvoiceProviderPort,
} from '../../ports/platform-billing';
import {
  IssuePlatformDocumentSchema,
  PlatformBillingSettingsSchema,
  PlatformDocumentSourceSchema,
} from '../../validation/platform-billing';
import { parsePlatformReport } from '../../domain/platform-reporting';
import { withPortalActor } from './actor';
import { failure } from '../../../lib/errors';
import { ERROR_CODES } from '../../../config/constants';
export class PlatformBillingUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: PlatformBillingRepositoryPort,
    private readonly provider: PlatformInvoiceProviderPort,
    private readonly originalsAvailable = false,
  ) {}
  canReadOriginals() {
    return this.originalsAvailable;
  }
  settings() {
    return withPortalActor(this.identity, 'PlatformBilling', (actor) =>
      this.repository.settings(actor),
    );
  }
  saveSettings(raw: unknown) {
    return withPortalActor(this.identity, 'PlatformBilling', async (actor) => {
      const parsed = PlatformBillingSettingsSchema.safeParse(raw);
      return parsed.success
        ? this.repository.saveSettings(actor, parsed.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'PlatformBilling', 'settings');
    });
  }
  source(raw: unknown) {
    return withPortalActor(this.identity, 'PlatformBilling', async (actor) => {
      const parsed = PlatformDocumentSourceSchema.safeParse(raw);
      return parsed.success
        ? this.repository.source(actor, parsed.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'PlatformBilling', 'source');
    });
  }
  documents(raw: unknown) {
    return withPortalActor(this.identity, 'PlatformBilling', async (actor) => {
      const parsed = parsePlatformReport(raw);
      return parsed.ok ? this.repository.documents(actor, parsed.value) : parsed;
    });
  }
  issue(raw: unknown) {
    return withPortalActor(this.identity, 'PlatformBilling', async (actor) => {
      const parsed = IssuePlatformDocumentSchema.safeParse(raw);
      return parsed.success
        ? this.repository.issue(actor, parsed.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'PlatformBilling', 'issue');
    });
  }
  download(raw: unknown) {
    return withPortalActor(this.identity, 'PlatformBilling', async (actor) => {
      const parsed = z.uuid().safeParse(raw);
      return parsed.success
        ? this.repository.download(actor, parsed.data)
        : failure(ERROR_CODES.VALIDATION_FAILED, 'PlatformBilling', 'document');
    });
  }
  original(raw: unknown) {
    return withPortalActor(this.identity, 'PlatformBilling', async (actor) => {
      const id = z.uuid().safeParse(raw);
      if (!id.success) return failure(ERROR_CODES.VALIDATION_FAILED, 'PlatformBilling', 'invoice');
      const source = await this.repository.subscriptionSource(actor, id.data);
      return source.ok
        ? this.provider.original(source.value.invoiceId, source.value.customerId)
        : source;
    });
  }
}
