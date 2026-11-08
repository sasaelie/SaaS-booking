import type { Result } from '../../lib/result';
import type { PortalActor } from './portal-models';
export interface SubscriptionGatewayPort {
  checkout(actor: PortalActor, organizationId: string): Promise<Result<{ readonly url: string }>>;
  cancel(actor: PortalActor, organizationId: string): Promise<Result<void>>;
  reactivate(
    actor: PortalActor,
    organizationId: string,
  ): Promise<Result<{ readonly url: string | null }>>;
  billingPortal(
    actor: PortalActor,
    organizationId: string,
  ): Promise<Result<{ readonly url: string }>>;
}
