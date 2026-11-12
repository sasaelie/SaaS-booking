import { portal } from '../../../../composition/portal';
import { HTTP_STATUS } from '../../../../config/constants';
import { ACCOUNTING } from '../../../../config/accounting';
export async function GET(request: Request) {
  const app = portal(request.headers);
  if (!app.ok) return new Response(null, { status: HTTP_STATUS.UNAVAILABLE });
  const query = new URL(request.url).searchParams;
  const id = query.get('organizationId');
  const xlsx = query.get('format') === 'xlsx';
  if (xlsx) {
    const result = await app.value.financial.workbook(id);
    return result.ok
      ? new Response(new Blob([new Uint8Array(result.value)]), {
          headers: {
            'Content-Type': ACCOUNTING.MIME,
            'Content-Disposition': `attachment; filename="${ACCOUNTING.FILENAME}"`,
            'Cache-Control': 'private, no-store',
          },
        })
      : new Response(null, { status: HTTP_STATUS.FORBIDDEN });
  }
  const result = await app.value.financial.export(id);
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
