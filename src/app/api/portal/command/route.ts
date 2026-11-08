import { portalMutationError } from '../../../../composition/portal-mutation';
import { boundedJson } from '../../../../lib/http-body';
import { trustedOrigin } from '../../../../lib/trusted-origin';
import { HTTP_STATUS } from '../../../../config/constants';
import { runtime } from '../../../../composition/runtime';
import { portal } from '../../../../composition/portal';
import { dispatchPortal } from '../../../../composition/portal-command';
import { PortalCommandSchema } from '../../../../core/validation/portal-command';
export async function POST(request: Request): Promise<Response> {
  const app = runtime();
  if (!app.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  if (!trustedOrigin(request, app.value.env.NEXT_PUBLIC_APP_URL))
    return Response.json({ success: false }, { status: HTTP_STATUS.FORBIDDEN });
  const denied = await portalMutationError(request.headers);
  if (denied) return denied;
  const services = portal(request.headers);
  if (!services.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  const body = await boundedJson(request);
  if (!body.ok) return Response.json({ success: false }, { status: HTTP_STATUS.BAD_REQUEST });
  const parsed = PortalCommandSchema.safeParse(body.value);
  if (!parsed.success)
    return Response.json({ success: false }, { status: HTTP_STATUS.BAD_REQUEST });
  const result = await dispatchPortal(services.value, parsed.data);
  return Response.json(
    result.ok ? { success: true, data: result.value } : { success: false, code: result.error.code },
    {
      status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
