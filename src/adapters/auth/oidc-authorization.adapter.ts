import { createRemoteJWKSet, jwtVerify } from 'jose';
import { z } from 'zod';
import type { AuthorizationPort } from '../../core/ports/authorization.port';
import { failure } from '../../lib/errors';
import { ok, type Result } from '../../lib/result';
import { ERROR_CODES } from '../../config/constants';
const AdminClaimsSchema = z.object({
  sub: z.string().min(1),
  organization_id: z.uuid(),
  role: z.literal('admin'),
});
export class OidcAuthorizationAdapter implements AuthorizationPort {
  constructor(
    private readonly token: string,
    private readonly settings: {
      readonly issuer: string;
      readonly audience: string;
      readonly jwksUrl: string;
    } | null,
  ) {}
  async authorizeOrganizationAdmin(organizationId: string): Promise<Result<void>> {
    if (!this.settings || !this.token)
      return failure(ERROR_CODES.UNAUTHORIZED, 'Authorization', 'admin');
    try {
      const { payload } = await jwtVerify(
        this.token,
        createRemoteJWKSet(new URL(this.settings.jwksUrl)),
        {
          issuer: this.settings.issuer,
          audience: this.settings.audience,
          algorithms: ['RS256', 'ES256'],
        },
      );
      const claims = AdminClaimsSchema.safeParse(payload);
      return claims.success && claims.data.organization_id === organizationId
        ? ok(undefined)
        : failure(ERROR_CODES.UNAUTHORIZED, 'Authorization', 'admin');
    } catch {
      return failure(ERROR_CODES.UNAUTHORIZED, 'Authorization', 'admin');
    }
  }
}
