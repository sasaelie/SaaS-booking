import { portalMutationError } from '../../../../composition/portal-mutation';
import { runtime } from '../../../../composition/runtime';
import { brandMedia } from '../../../../composition/brand-media';
import { trustedOrigin } from '../../../../lib/trusted-origin';
import { boundedBody } from '../../../../lib/http-body';
import { HTTP_STATUS, PAYMENT_RULES } from '../../../../config/constants';
export async function POST(request: Request): Promise<Response> {
  const app = runtime();
  if (!app.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  if (!trustedOrigin(request, app.value.env.NEXT_PUBLIC_APP_URL))
    return Response.json({ success: false }, { status: HTTP_STATUS.FORBIDDEN });
  const denied = await portalMutationError(request.headers);
  if (denied) return denied;
  const services = brandMedia(request.headers);
  if (!services.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  const url = new URL(request.url);
  const bytes = await boundedBody(request, PAYMENT_RULES.MAX_PROOF_FILE_SIZE_BYTES);
  if (!bytes.ok) return Response.json({ success: false }, { status: HTTP_STATUS.TOO_LARGE });
  const result = await services.value.execute(
    { organizationId: url.searchParams.get('organizationId'), kind: url.searchParams.get('kind') },
    bytes.value,
  );
  return Response.json(
    result.ok ? { success: true } : { success: false, code: result.error.code },
    { status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST },
  );
}

export async function DELETE(request: Request): Promise<Response> {
  const app = runtime();
  if (!app.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  if (!trustedOrigin(request, app.value.env.NEXT_PUBLIC_APP_URL))
    return Response.json({ success: false }, { status: HTTP_STATUS.FORBIDDEN });
  const denied = await portalMutationError(request.headers);
  if (denied) return denied;
  const service = brandMedia(request.headers);
  if (!service.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  const url = new URL(request.url);
  const result = await service.value.remove({
    organizationId: url.searchParams.get('organizationId'),
    kind: url.searchParams.get('kind'),
  });
  return Response.json(
    { success: result.ok },
    { status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST },
  );
}
