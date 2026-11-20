import { runtime } from '../../../../composition/runtime';
import { portal } from '../../../../composition/portal';
import { portalMutationError } from '../../../../composition/portal-mutation';
import { boundedJson } from '../../../../lib/http-body';
import { trustedOrigin } from '../../../../lib/trusted-origin';
import { ERROR_CODES, HTTP_STATUS } from '../../../../config/constants';
export async function POST(request: Request) {
  const app = runtime();
  if (!app.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  if (!trustedOrigin(request, app.value.env.NEXT_PUBLIC_APP_URL))
    return Response.json({ success: false }, { status: HTTP_STATUS.FORBIDDEN });
  const denied = await portalMutationError(request.headers);
  if (denied) return denied;
  const services = portal(request.headers),
    body = await boundedJson(request);
  if (!services.ok || !body.ok)
    return Response.json({ success: false }, { status: HTTP_STATUS.BAD_REQUEST });
  const result = await services.value.security.mutate(body.value);
  return Response.json(
    result.ok ? { success: true, data: result.value } : { success: false, code: result.error.code },
    {
      status: result.ok
        ? HTTP_STATUS.OK
        : result.error.code === ERROR_CODES.RATE_LIMITED
          ? HTTP_STATUS.RATE_LIMITED
          : HTTP_STATUS.BAD_REQUEST,
      headers: { 'Cache-Control': 'private, no-store' },
    },
  );
}
