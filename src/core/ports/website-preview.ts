import type { Result } from '../../lib/result';
import type { PublicCatalog } from './public-catalog.port';
import type { OrganizationSummary } from './portal-models';
export interface WebsitePreviewAccessPorts {
  readonly security: {
    read(): Promise<Result<{ readonly enabled: boolean; readonly verified: boolean }>>;
  };
  readonly catalog: { execute(slug: unknown): Promise<Result<PublicCatalog>> };
  readonly organizations: {
    get(id: unknown): Promise<Result<Pick<OrganizationSummary, 'id' | 'role'>>>;
  };
}
