import 'server-only';
import { runtime } from './runtime';
import { authentication } from './authentication';
import { SessionIdentityAdapter } from '../adapters/auth/session-identity.adapter';
import { PortalMutationAccessUseCase } from '../core/use-cases/portal/mutation-access.use-case';
import { ERROR_CODES, HTTP_STATUS } from '../config/constants';
export async function portalMutationError(headers: Headers): Promise<Response | null> {
  const app = runtime();
  if (!app.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  const auth = authentication();
  if (!auth.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  const access = await new PortalMutationAccessUseCase(
    new SessionIdentityAdapter(auth.value, headers),
    app.value.limiter,
  ).execute();
  return access.ok
    ? null
    : Response.json(
        { success: false, code: access.error.code },
        {
          status:
            access.error.code === ERROR_CODES.RATE_LIMITED
              ? HTTP_STATUS.RATE_LIMITED
              : HTTP_STATUS.UNAUTHORIZED,
        },
      );
}
