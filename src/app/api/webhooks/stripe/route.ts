import { boundedBody } from '../../../../lib/http-body';
import { HTTP_STATUS } from '../../../../config/constants';
import { runtime as runtimeServices } from '../../../../composition/runtime';
import { ERROR_CODES, JOB_RULES } from '../../../../config/constants';
export const runtime = 'nodejs';
export async function POST(request: Request): Promise<Response> {
  const services = runtimeServices();
  if (!services.ok) return Response.json({ received: false }, { status: HTTP_STATUS.UNAVAILABLE });
  const bytes = await boundedBody(request, JOB_RULES.MAX_WEBHOOK_BYTES);
  if (!bytes.ok) return new Response(null, { status: HTTP_STATUS.TOO_LARGE });
  const body = new TextDecoder().decode(bytes.value);
  const result = await services.value.webhook.execute(
    body,
    request.headers.get('stripe-signature') ?? '',
  );
  if (!result.ok)
    return Response.json(
      { received: false },
      {
        status:
          result.error.code === ERROR_CODES.UNAUTHORIZED
            ? HTTP_STATUS.BAD_REQUEST
            : HTTP_STATUS.INTERNAL,
      },
    );
  return Response.json({ received: true });
}
