import { boundedJson } from '../../../lib/http-body';
import { HTTP_STATUS } from '../../../config/constants';
import { runtime } from '../../../composition/runtime';
import { administration } from '../../../composition/administration';
import { dispatchAdmin } from '../../../composition/admin-dispatch';
import { AdminCommandSchema } from '../../../core/validation/admin-command';
export async function POST(request: Request): Promise<Response> {
  const app = runtime();
  if (!app.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  const body = await boundedJson(request);
  if (!body.ok) return Response.json({ success: false }, { status: HTTP_STATUS.BAD_REQUEST });
  const parsed = AdminCommandSchema.safeParse(body.value);
  if (!parsed.success)
    return Response.json({ success: false }, { status: HTTP_STATUS.BAD_REQUEST });
  const auth = request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '';
  const result = await dispatchAdmin(administration(app.value, auth), parsed.data);
  if (result.ok && parsed.data.action === 'review-bank') await app.value.runner.runBatch();
  return Response.json(
    result.ok ? { success: true, data: result.value } : { success: false, code: result.error.code },
    {
      status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.FORBIDDEN,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
