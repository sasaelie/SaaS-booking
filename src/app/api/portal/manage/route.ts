import { portalMutationError } from '../../../../composition/portal-mutation';
import { LocalPauseSchema } from '../../../../core/validation/local-pause';
import { boundedJson } from '../../../../lib/http-body';
import { trustedOrigin } from '../../../../lib/trusted-origin';
import { HTTP_STATUS } from '../../../../config/constants';
import { runtime } from '../../../../composition/runtime';
import { portal } from '../../../../composition/portal';
import { dispatchAdmin } from '../../../../composition/admin-dispatch';
import { AdminCommandSchema } from '../../../../core/validation/admin-command';
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
  const local = LocalPauseSchema.safeParse(body.value);
  if (local.success) {
    const result = await services.value.pause.execute(local.data);
    return Response.json(
      result.ok
        ? { success: true, data: result.value }
        : { success: false, code: result.error.code },
      {
        status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
        headers: { 'Cache-Control': 'no-store' },
      },
    );
  }
  const parsed = AdminCommandSchema.safeParse(body.value);
  if (!parsed.success)
    return Response.json({ success: false }, { status: HTTP_STATUS.BAD_REQUEST });
  const result = await dispatchAdmin(services.value.administration, parsed.data);
  if (result.ok && parsed.data.action === 'review-bank') await services.value.runner.runBatch();
  return Response.json(
    result.ok ? { success: true, data: result.value } : { success: false, code: result.error.code },
    {
      status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
