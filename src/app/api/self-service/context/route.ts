import { selfBooking } from '../../../../composition/self-booking';
import { boundedJson } from '../../../../lib/http-body';
import { SelfCancelTokenSchema } from '../../../../core/validation/self-service';
import { HTTP_STATUS } from '../../../../config/constants';
export async function POST(request: Request): Promise<Response> {
  const body = await boundedJson(request);
  const token =
    body.ok && typeof body.value === 'object' && body.value !== null && 'token' in body.value
      ? SelfCancelTokenSchema.safeParse(body.value.token)
      : null;
  const service = selfBooking();
  if (!token?.success || !service.ok)
    return Response.json({ success: false }, { status: HTTP_STATUS.BAD_REQUEST });
  const result = await service.value.execute(token.data);
  return Response.json(result.ok ? { success: true, data: result.value } : { success: false }, {
    status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.UNAUTHORIZED,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
