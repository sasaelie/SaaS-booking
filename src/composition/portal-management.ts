import type { PortalServices } from './portal';
import type { Result } from '../lib/result';
import { LocalPauseSchema } from '../core/validation/local-pause';
import { AdminCommandSchema } from '../core/validation/admin-command';
import { scheduleCancellationNotifications } from './cancellation-notifications';
import { dispatchAdmin } from './admin-dispatch';
import { HTTP_STATUS } from '../config/constants';
export async function managePortalCommand(raw: unknown, services: PortalServices) {
  const local = LocalPauseSchema.safeParse(raw);
  if (local.success)
    return respond(await services.pause.execute(local.data), local.data.organizationId, services);
  const parsed = AdminCommandSchema.safeParse(raw);
  if (!parsed.success)
    return Response.json({ success: false }, { status: HTTP_STATUS.BAD_REQUEST });
  const result = await dispatchAdmin(services.administration, parsed.data);
  if (result.ok && parsed.data.action === 'review-bank') await services.runner.runBatch();
  return respond(result, parsed.data.organizationId, services);
}
function respond(result: Result<unknown>, organizationId: string, services: PortalServices) {
  if (result.ok) scheduleCancellationNotifications(organizationId, result.value, services.runner);
  return Response.json(
    result.ok ? { success: true, data: result.value } : { success: false, code: result.error.code },
    {
      status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.BAD_REQUEST,
      headers: { 'Cache-Control': 'no-store' },
    },
  );
}
