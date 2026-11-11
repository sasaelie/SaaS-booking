import { portal } from '../../../../composition/portal';
import { HTTP_STATUS } from '../../../../config/constants';
export async function GET(request: Request): Promise<Response> {
  const service = portal(request.headers);
  if (!service.ok) return new Response(null, { status: HTTP_STATUS.UNAVAILABLE });
  const query = new URL(request.url).searchParams;
  const result = await service.value.share.qrCode({
    organizationId: query.get('organizationId'),
    activityId: query.get('activityId') ?? undefined,
    format: query.get('format') ?? 'png',
  });
  return result.ok
    ? new Response(new Uint8Array(result.value), {
        headers: {
          'Content-Type': query.get('format') === 'pdf' ? 'application/pdf' : 'image/png',
          'Content-Disposition':
            query.get('format') === 'pdf'
              ? 'attachment; filename="reservation-affiche.pdf"'
              : 'attachment; filename="reservation-qr.png"',
          'Cache-Control': 'no-store',
        },
      })
    : new Response(null, { status: HTTP_STATUS.FORBIDDEN });
}
