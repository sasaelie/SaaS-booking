import { privateFiles } from '../../../composition/private-files';
import { HTTP_STATUS } from '../../../config/constants';
import { PRIVATE_FILES } from '../../../config/private-files';
export async function GET(request: Request): Promise<Response> {
  const service = privateFiles();
  const result = service.ok
    ? await service.value.execute(new URL(request.url).searchParams.get('token'))
    : service;
  return result.ok
    ? new Response(new Uint8Array(result.value), {
        headers: {
          'Content-Type': PRIVATE_FILES.MIME_TYPE,
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
          'Referrer-Policy': 'no-referrer',
        },
      })
    : new Response(null, {
        status: HTTP_STATUS.NOT_FOUND,
        headers: { 'Cache-Control': 'no-store' },
      });
}
