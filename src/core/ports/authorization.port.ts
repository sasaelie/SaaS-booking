import type { Result } from '../../lib/result';
export interface AuthorizationPort {
  authorizeOrganizationAdmin(organizationId: string): Promise<Result<void>>;
}
