import { boundedJson } from '../../../lib/http-body';
import { runtime } from '../../../composition/runtime';
import { HTTP_STATUS } from '../../../config/constants';
export async function POST(request: Request): Promise<Response> {
  const app = runtime();
  if (!app.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  const limit = await app.value.limiter.accept(
    `voucher:${request.headers.get('x-forwarded-for') ?? 'local'}`,
  );
  if (!limit.ok) return Response.json({ success: false }, { status: HTTP_STATUS.RATE_LIMITED });
  const body = await boundedJson(request);
  if (!body.ok) return Response.json({ success: false }, { status: HTTP_STATUS.BAD_REQUEST });
  const result = await app.value.voucherQuote.execute(body.value);
  return Response.json(
    result.ok
      ? {
          success: true,
          remainingToPayCents: result.value.remainingToPayCents,
          forfeitedRemainderCents: result.value.forfeitedRemainderCents,
          remainderValueCents: result.value.remainderValueCents,
        }
      : { success: false },
    {
      status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
