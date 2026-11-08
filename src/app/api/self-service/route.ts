import { boundedJson } from '../../../lib/http-body';
import { HTTP_STATUS } from '../../../config/constants';
import { z } from 'zod';
import { runtime } from '../../../composition/runtime';
import { administration } from '../../../composition/administration';
import { INPUT_LIMITS } from '../../../config/constants';
const RequestSchema = z.object({
  token: z.string().min(1).max(INPUT_LIMITS.TOKEN_MAX),
});
export async function POST(request: Request): Promise<Response> {
  const app = runtime();
  if (!app.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  const body = await boundedJson(request);
  if (!body.ok) return Response.json({ success: false }, { status: HTTP_STATUS.BAD_REQUEST });
  const input = RequestSchema.safeParse(body.value);
  if (!input.success) return Response.json({ success: false }, { status: HTTP_STATUS.BAD_REQUEST });
  const limit = await app.value.limiter.accept(
    `self-service:${request.headers.get('x-forwarded-for') ?? 'local'}`,
  );
  if (!limit.ok) return Response.json({ success: false }, { status: HTTP_STATUS.RATE_LIMITED });
  const result = await administration(app.value, '').voucher.cancelByAttendee(input.data);
  return Response.json(
    result.ok ? { success: true, data: result.value } : { success: false, code: result.error.code },
    {
      status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
