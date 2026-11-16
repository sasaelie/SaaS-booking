import { selfBooking } from '../../../../composition/self-booking';
import { boundedJson } from '../../../../lib/http-body';
import { SelfCancelTokenSchema } from '../../../../core/validation/self-service';
import { HTTP_STATUS, ERROR_CODES } from '../../../../config/constants';
import { resolveParticipantToken } from '../../../../composition/participant';
export async function POST(request: Request): Promise<Response> {
  const body = await boundedJson(request);
  const token =
    body.ok && typeof body.value === 'object' && body.value !== null && 'token' in body.value
      ? SelfCancelTokenSchema.safeParse(body.value.token)
      : null;
  const service = selfBooking();
  if (!service.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  if (!token?.success)
    return Response.json({ success: false }, { status: HTTP_STATUS.BAD_REQUEST });
  const resolved = await resolveParticipantToken(token.data, request);
  const result = resolved.ok ? await service.value.execute(resolved.value) : resolved;
  return Response.json(result.ok ? { success: true, data: result.value } : { success: false }, {
    status: result.ok
      ? HTTP_STATUS.OK
      : result.error.code === ERROR_CODES.UNAUTHORIZED
        ? HTTP_STATUS.UNAUTHORIZED
        : HTTP_STATUS.UNAVAILABLE,
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
