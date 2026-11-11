import { SubscriptionInputSchema } from '../../validation/commercial';
import { ok } from '../../../lib/result';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import type { PortalIdentityPort } from '../../ports/portal-identity.port';
import type { SubscriptionGatewayPort } from '../../ports/subscription-gateway.port';
import { withPortalActor } from './actor';
type Operation = 'checkout' | 'cancel' | 'reactivate' | 'billingPortal';
export class SubscriptionUseCase {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly gateway: SubscriptionGatewayPort,
  ) {}
  execute(raw: unknown) {
    return withPortalActor(this.identity, 'Subscription', async (actor) => {
      const parsed = SubscriptionInputSchema.safeParse(raw);
      if (!parsed.success) return failure(ERROR_CODES.VALIDATION_FAILED, 'Subscription', 'execute');
      const operation: Operation = parsed.data.operation;
      const result =
        operation === 'checkout'
          ? await this.gateway.checkout(actor, parsed.data.organizationId, parsed.data.interval)
          : await this.gateway[operation](actor, parsed.data.organizationId);
      if (!result.ok) return result;
      return ok({ url: result.value ? result.value.url : null });
    });
  }
}
