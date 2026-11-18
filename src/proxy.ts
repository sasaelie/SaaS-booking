import { randomBytes } from 'node:crypto';
import { SECURITY } from './config/security';
import { contentSecurityPolicy } from './lib/content-security-policy';
import { NextResponse, type NextRequest } from 'next/server';
import { isSessionNavigationPath } from './lib/session-navigation';
import { SESSION_NAVIGATION } from './config/session-navigation';
import { PUBLIC_SITE } from './config/public-site';
import { publicSiteSettings, isMarketingPath, isPublicSearchPath } from './lib/public-site';
export function proxy(request: NextRequest) {
  const nonce = randomBytes(SECURITY.NONCE_BYTES).toString('base64');
  const policy = contentSecurityPolicy(
    nonce,
    request.nextUrl.pathname,
    process.env['NEXT_PUBLIC_APP_URL'] ?? '',
    process.env.NODE_ENV === 'development',
  );
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(SECURITY.NONCE_HEADER, nonce);
  requestHeaders.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('Content-Security-Policy', policy);
  response.headers.set('Permissions-Policy', SECURITY.PERMISSIONS_POLICY);
  if (!publicSiteSettings().indexable || !isPublicSearchPath(request.nextUrl.pathname))
    response.headers.set('X-Robots-Tag', PUBLIC_SITE.NO_INDEX);
  if (
    isSessionNavigationPath(request.nextUrl.pathname) ||
    isMarketingPath(request.nextUrl.pathname)
  )
    response.headers.set('Cache-Control', SESSION_NAVIGATION.NO_STORE);
  if (!request.nextUrl.pathname.startsWith('/embed/'))
    response.headers.set('X-Frame-Options', 'DENY');
  if (request.nextUrl.pathname.startsWith('/api/'))
    response.headers.set('Cache-Control', 'private, no-store');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
