import type { Result } from '../../lib/result';
import type { PortalActor } from './portal-models';
export interface ConnectGatewayPort {
  authorize(actor: PortalActor, organizationId: string): Promise<Result<{ readonly url: string }>>;
  callback(
    actor: PortalActor,
    state: string,
    code: string,
  ): Promise<Result<{ readonly organizationId: string }>>;
  usePlatform(actor: PortalActor, organizationId: string): Promise<Result<void>>;
}

export interface ConnectAccountWebhookPort {
  handle(body: string, signature: string): Promise<Result<void>>;
}
