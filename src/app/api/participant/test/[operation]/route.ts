import { clientSource } from '../../../../../lib/client-source';
import { simulationParticipant } from '../../../../../composition/simulation-participant';
import { trustedOrigin } from '../../../../../lib/trusted-origin';
import { boundedJson } from '../../../../../lib/http-body';
import { HTTP_STATUS, ERROR_CODES } from '../../../../../config/constants';
export async function POST(
  request: Request,
  { params }: { readonly params: Promise<{ operation: string }> },
) {
  const app = simulationParticipant();
  if (!app.ok) return respond({ success: false }, HTTP_STATUS.UNAVAILABLE);
  if (!trustedOrigin(request, app.value.appUrl))
    return respond({ success: false }, HTTP_STATUS.FORBIDDEN);
  const source = clientSource(request.headers);
  const limited = await app.value.limiter.accept(`participant-test:${source}`);
  if (!limited.ok) return respond({ success: false }, HTTP_STATUS.RATE_LIMITED);
  const body = await boundedJson(request);
  if (!body.ok) return respond({ success: false }, HTTP_STATUS.BAD_REQUEST);
  const { operation } = await params;
  const result = await app.value.operations.execute(operation, body.value);
  return respond(
    result.ok ? { success: true, data: result.value } : { success: false, code: result.error.code },
    result.ok
      ? HTTP_STATUS.OK
      : result.error.code === ERROR_CODES.UNAUTHORIZED
        ? HTTP_STATUS.UNAUTHORIZED
        : [ERROR_CODES.INTERNAL_ERROR, ERROR_CODES.CONFIGURATION_ERROR].some(
              (code) => code === result.error.code,
            )
          ? HTTP_STATUS.UNAVAILABLE
          : HTTP_STATUS.BAD_REQUEST,
  );
}
function respond(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'private, no-store',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
