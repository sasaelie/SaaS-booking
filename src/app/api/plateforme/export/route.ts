import { portal } from '../../../../composition/portal';
import { HTTP_STATUS } from '../../../../config/constants';
import { PLATFORM_REPORTING } from '../../../../config/platform-reporting';
export async function GET(request: Request) {
  const app = portal(request.headers);
  if (!app.ok) return new Response(null, { status: HTTP_STATUS.UNAVAILABLE });
  const query = new URL(request.url).searchParams;
  const format = query.get('format') === 'xlsx' ? 'xlsx' : 'csv';
  const result = await app.value.reporting.export(Object.fromEntries(query), format);
  if (!result.ok)
    return new Response(PLATFORM_REPORTING.EXPORT_ERROR, { status: HTTP_STATUS.FORBIDDEN });
  return new Response(new Blob([new Uint8Array(result.value)]), {
    headers: {
      'Content-Type':
        format === 'csv'
          ? 'text/csv; charset=utf-8'
          : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="journal-plateforme.${format}"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
