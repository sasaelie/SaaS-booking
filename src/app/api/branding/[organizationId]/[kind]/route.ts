import { publicBrandMedia } from '../../../../../composition/brand-media';
import { HTTP_STATUS } from '../../../../../config/constants';
export async function GET(
  _request: Request,
  { params }: { readonly params: Promise<{ organizationId: string; kind: string }> },
): Promise<Response> {
  const input = await params;
  const service = publicBrandMedia();
  if (!service.ok) return new Response(null, { status: HTTP_STATUS.NOT_FOUND });
  const result = await service.value.execute(input);
  return result.ok
    ? new Response(new Uint8Array(result.value), {
        headers: {
          'Content-Type': 'image/png',
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      })
    : new Response(null, { status: HTTP_STATUS.NOT_FOUND });
}
