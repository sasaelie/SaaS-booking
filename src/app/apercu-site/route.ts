import { websitePreview, websitePreviewDocument } from '../../composition/website-preview';
import { WEBSITE_PREVIEW as W } from '../../config/website-preview';
import { SECURITY } from '../../config/security';
import { HTTP_STATUS } from '../../config/constants';
export const dynamic = 'force-dynamic';
export async function GET(request: Request) {
  const authorized = await websitePreview(request.headers, W.SLUG);
  if (!authorized.ok) {
    if (authorized.error.code === 'UNAUTHORIZED' || authorized.error.code === 'MFA_REQUIRED')
      return Response.redirect(
        new URL(
          authorized.error.code === 'MFA_REQUIRED' ? '/compte/securite' : '/connexion',
          request.url,
        ),
      );
    return new Response(null, { status: HTTP_STATUS.NOT_FOUND });
  }
  const document = await websitePreviewDocument(request.headers.get(SECURITY.NONCE_HEADER));
  return new Response(document.ok ? document.value : null, {
    status: document.ok ? HTTP_STATUS.OK : HTTP_STATUS.UNAVAILABLE,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
