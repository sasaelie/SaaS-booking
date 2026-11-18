import { portal } from '../../../../composition/portal';
import { PLATFORM_BILLING } from '../../../../config/platform-billing';
import { HTTP_STATUS } from '../../../../config/constants';
export async function GET(request: Request) {
  const app = portal(request.headers);
  if (!app.ok) return new Response(null, { status: HTTP_STATUS.UNAVAILABLE });
  const query = new URL(request.url).searchParams;
  if (query.has('entry')) {
    const original = await app.value.billing.original(query.get('entry'));
    return original.ok
      ? new Response(null, {
          status: HTTP_STATUS.SEE_OTHER,
          headers: { Location: original.value, 'Cache-Control': 'private, no-store' },
        })
      : new Response(PLATFORM_BILLING.PROVIDER_UNAVAILABLE, {
          status: HTTP_STATUS.FORBIDDEN,
          headers: { 'Cache-Control': 'private, no-store' },
        });
  }
  const document = await app.value.billing.download(query.get('id'));
  return document.ok
    ? new Response(new Blob([new Uint8Array(document.value.bytes)]), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${document.value.filename}"`,
          'Cache-Control': 'private, no-store',
        },
      })
    : new Response(null, { status: HTTP_STATUS.FORBIDDEN });
}
