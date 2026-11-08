import type { AuthorizationPort } from '../../core/ports/authorization.port';
import type { PortalIdentityPort } from '../../core/ports/portal-identity.port';
import type { PortalRepositoryPort } from '../../core/ports/portal-repository.port';
import { ok } from '../../lib/result';
export class MembershipAuthorizationAdapter implements AuthorizationPort {
  constructor(
    private readonly identity: PortalIdentityPort,
    private readonly repository: PortalRepositoryPort,
  ) {}
  async authorizeOrganizationAdmin(organizationId: string) {
    const actor = await this.identity.current();
    if (!actor.ok) return actor;
    const organization = await this.repository.getOrganization(actor.value, organizationId);
    return organization.ok ? ok(undefined) : organization;
  }
}
