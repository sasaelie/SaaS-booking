import { authentication } from '../../../../composition/authentication';
import { ERROR_CODES, HTTP_STATUS } from '../../../../config/constants';
import { failure } from '../../../../lib/errors';
async function handle(request: Request): Promise<Response> {
  const auth = authentication();
  if (!auth.ok)
    return Response.json({ error: 'AUTH_UNAVAILABLE' }, { status: HTTP_STATUS.UNAVAILABLE });
  try {
    return await auth.value.handler(request);
  } catch {
    failure(ERROR_CODES.INTERNAL_ERROR, 'Authentication', 'request');
    return Response.json({ error: 'AUTH_UNAVAILABLE' }, { status: HTTP_STATUS.UNAVAILABLE });
  }
}
export const GET = handle;
export const POST = handle;
