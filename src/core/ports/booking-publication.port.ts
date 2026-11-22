import type { Result } from '../../lib/result';
import type { PortalActor } from './portal-models';
export interface BookingPublicationTarget {
  readonly appUrl: string;
  readonly published: boolean;
  readonly activationRequired: boolean;
}
export interface BookingPublicationPort {
  read(actor: PortalActor, organizationId: string): Promise<Result<BookingPublicationTarget>>;
  publish(actor: PortalActor, organizationId: string): Promise<Result<void>>;
}
