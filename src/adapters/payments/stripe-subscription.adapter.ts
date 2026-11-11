import type { Result } from '../../lib/result';
import type { Pool } from 'pg';
import type { SubscriptionGatewayPort } from '../../core/ports/subscription-gateway.port';
import type { PortalActor } from '../../core/ports/portal-models';
import type { BillingSettings } from './saas/context';
import { billingLock } from './saas/lock';
import { checkout } from './saas/checkout';
import { changeRenewal, billingPortal } from './saas/change';
import { ERROR_CODES } from '../../config/constants';
import { failure } from '../../lib/errors';
export class StripeSubscriptionAdapter implements SubscriptionGatewayPort {
  constructor(
    private readonly pool: Pool,
    private readonly settings: BillingSettings | null,
  ) {}
  checkout(actor: PortalActor, organizationId: string, interval: 'month' | 'year' = 'month') {
    const settings = this.settings;
    if (!settings)
      return Promise.resolve(
        failure(ERROR_CODES.CONFIGURATION_ERROR, 'Subscription', 'configuration'),
      );
    return billingLock(this.pool, organizationId, (db) =>
      checkout({ ...settings, db, actor, organizationId, interval }),
    );
  }
  async cancel(actor: PortalActor, organizationId: string): Promise<Result<void>> {
    const settings = this.settings;
    if (!settings) return failure(ERROR_CODES.CONFIGURATION_ERROR, 'Subscription', 'configuration');
    const result = await billingLock(this.pool, organizationId, (db) =>
      changeRenewal({ ...settings, db, actor, organizationId }, true),
    );
    return result.ok ? { ok: true as const, value: undefined } : result;
  }
  reactivate(actor: PortalActor, organizationId: string) {
    const settings = this.settings;
    if (!settings)
      return Promise.resolve(
        failure(ERROR_CODES.CONFIGURATION_ERROR, 'Subscription', 'configuration'),
      );
    return billingLock(this.pool, organizationId, (db) =>
      changeRenewal({ ...settings, db, actor, organizationId }, false),
    );
  }
  billingPortal(actor: PortalActor, organizationId: string) {
    const settings = this.settings;
    if (!settings)
      return Promise.resolve(
        failure(ERROR_CODES.CONFIGURATION_ERROR, 'Subscription', 'configuration'),
      );
    return billingLock(this.pool, organizationId, (db) =>
      billingPortal({ ...settings, db, actor, organizationId }),
    );
  }
}
