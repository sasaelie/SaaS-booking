import { HTTP_STATUS } from '../../../config/constants';
import { timingSafeEqual } from 'node:crypto';
import { runtime } from '../../../composition/runtime';
import { administration } from '../../../composition/administration';
export async function POST(request: Request): Promise<Response> {
  const app = runtime();
  if (!app.ok || !app.value.env.CRON_SECRET)
    return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  const supplied = Buffer.from(request.headers.get('authorization') ?? '');
  const expected = Buffer.from(`Bearer ${app.value.env.CRON_SECRET}`);
  if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected))
    return new Response(null, { status: HTTP_STATUS.UNAUTHORIZED });
  const retention = await administration(app.value, '').gdpr.runScheduledUnpaidAnonymization();
  if (!retention.ok) return Response.json({ success: false }, { status: HTTP_STATUS.INTERNAL });
  const jobs = await app.value.runner.runBatch();
  return Response.json(jobs.ok ? { success: true, ...jobs.value } : { success: false }, {
    status: jobs.ok ? HTTP_STATUS.OK : HTTP_STATUS.INTERNAL,
  });
}
