import { boundedBody } from '../../../../lib/http-body';
import { ERROR_CODES, HTTP_STATUS, JOB_RULES } from '../../../../config/constants';
import { runtime as applicationRuntime } from '../../../../composition/runtime';
import { subscriptions } from '../../../../composition/subscriptions';
export const runtime = 'nodejs';
export async function POST(request: Request): Promise<Response> {
  const app = applicationRuntime();
  if (!app.ok) return Response.json({ received: false }, { status: HTTP_STATUS.UNAVAILABLE });
  const bytes = await boundedBody(request, JOB_RULES.MAX_WEBHOOK_BYTES);
  if (!bytes.ok) return new Response(null, { status: HTTP_STATUS.TOO_LARGE });
  const result = await subscriptions(app.value).webhook.execute(
    new TextDecoder().decode(bytes.value),
    request.headers.get('stripe-signature') ?? '',
  );
  return Response.json(
    { received: result.ok },
    {
      status: result.ok
        ? HTTP_STATUS.OK
        : result.error.code === ERROR_CODES.UNAUTHORIZED
          ? HTTP_STATUS.BAD_REQUEST
          : HTTP_STATUS.UNAVAILABLE,
    },
  );
}
