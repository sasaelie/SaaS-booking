import { z } from 'zod';
import { runtime } from '../../../../composition/runtime';
import { portal } from '../../../../composition/portal';
import { portalMutationError } from '../../../../composition/portal-mutation';
import { boundedJson } from '../../../../lib/http-body';
import { trustedOrigin } from '../../../../lib/trusted-origin';
import { HTTP_STATUS } from '../../../../config/constants';
const Command = z.object({ action: z.enum(['settings', 'issue']), input: z.unknown() });
export async function POST(request: Request) {
  const app = runtime();
  if (!app.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  if (!trustedOrigin(request, app.value.env.NEXT_PUBLIC_APP_URL))
    return Response.json({ success: false }, { status: HTTP_STATUS.FORBIDDEN });
  const denied = await portalMutationError(request.headers);
  if (denied) return denied;
  const services = portal(request.headers);
  const raw = await boundedJson(request);
  const command = raw.ok ? Command.safeParse(raw.value) : null;
  if (!services.ok || !command?.success)
    return Response.json({ success: false }, { status: HTTP_STATUS.BAD_REQUEST });
  const result =
    command.data.action === 'settings'
      ? await services.value.billing.saveSettings(command.data.input)
      : await services.value.billing.issue(command.data.input);
  return Response.json(
    result.ok
      ? { success: true, data: result.value ?? null }
      : { success: false, code: result.error.code },
    {
      status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
      headers: { 'Cache-Control': 'private, no-store' },
    },
  );
}
