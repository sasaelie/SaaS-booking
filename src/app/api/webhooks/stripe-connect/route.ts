import { financialWebhook } from '../../../../composition/financial-webhook';
import { boundedBody } from '../../../../lib/http-body';
import { ERROR_CODES, HTTP_STATUS, JOB_RULES } from '../../../../config/constants';
import { runtime as applicationRuntime } from '../../../../composition/runtime';
import { connectedWebhook } from '../../../../composition/connect';
export const runtime = 'nodejs';
export async function POST(request: Request): Promise<Response> {
  const app = applicationRuntime();
  if (!app.ok) return Response.json({ received: false }, { status: HTTP_STATUS.UNAVAILABLE });
  const bytes = await boundedBody(request, JOB_RULES.MAX_WEBHOOK_BYTES);
  if (!bytes.ok) return new Response(null, { status: HTTP_STATUS.TOO_LARGE });
  const result = await connectedWebhook(app.value).execute(
    new TextDecoder().decode(bytes.value),
    request.headers.get('stripe-signature') ?? '',
  );
  const financial = result.ok
    ? await financialWebhook(
        app.value,
        new TextDecoder().decode(bytes.value),
        request.headers.get('stripe-signature') ?? '',
        true,
      )
    : result;
  return Response.json(
    { received: financial.ok },
    {
      status: financial.ok
        ? HTTP_STATUS.OK
        : financial.error.code === ERROR_CODES.UNAUTHORIZED
          ? HTTP_STATUS.BAD_REQUEST
          : HTTP_STATUS.UNAVAILABLE,
    },
  );
}
