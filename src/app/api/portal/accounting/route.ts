import { portal } from '../../../../composition/portal';
import { HTTP_STATUS } from '../../../../config/constants';
export async function GET(request: Request) {
  const app = portal(request.headers);
  if (!app.ok) return new Response(null, { status: HTTP_STATUS.UNAVAILABLE });
  const result = await app.value.financial.export(
    new URL(request.url).searchParams.get('organizationId'),
  );
  return result.ok
    ? new Response(result.value, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="comptabilite.csv"',
          'Cache-Control': 'private, no-store',
        },
      })
    : new Response(null, { status: HTTP_STATUS.FORBIDDEN });
}
