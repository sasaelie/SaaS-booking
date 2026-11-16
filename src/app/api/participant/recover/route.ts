import { participantRecovery } from '../../../../composition/participant-recovery';
import { runtime } from '../../../../composition/runtime';
import { trustedOrigin } from '../../../../lib/trusted-origin';
import { boundedJson } from '../../../../lib/http-body';
import { HTTP_STATUS } from '../../../../config/constants';
export async function POST(request: Request) {
  const app = runtime();
  const service = participantRecovery(request.headers);
  if (!app.ok || !service.ok)
    return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  if (!trustedOrigin(request, app.value.env.NEXT_PUBLIC_APP_URL))
    return Response.json({ success: false }, { status: HTTP_STATUS.FORBIDDEN });
  const body = await boundedJson(request);
  const result = await service.value.execute(body.ok ? body.value : null);
  return Response.json(result.ok ? { success: true, code: result.value } : { success: false }, {
    status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.UNAUTHORIZED,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
