import type { Result } from '../../lib/result';
import type { PortalActor } from './portal-models';
export type BrandMediaKind = 'logo' | 'background';
export interface BrandMediaRepositoryPort {
  authorize(actor: PortalActor, organizationId: string): Promise<Result<void>>;
  stage(actor: PortalActor, organizationId: string, key: string): Promise<Result<void>>;
  attach(
    actor: PortalActor,
    organizationId: string,
    kind: BrandMediaKind,
    key: string | null,
  ): Promise<Result<void>>;
  asset(organizationId: string, kind: BrandMediaKind): Promise<Result<string>>;
}
export interface BrandMediaReaderPort {
  read(key: string): Promise<Result<Uint8Array>>;
}
