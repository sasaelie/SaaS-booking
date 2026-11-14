import { NextResponse, type NextRequest } from 'next/server';
import { isSessionNavigationPath } from './lib/session-navigation';
import { SESSION_NAVIGATION } from './config/session-navigation';
import { PUBLIC_SITE } from './config/public-site';
import { publicSiteSettings, isMarketingPath, isPublicSearchPath } from './lib/public-site';
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  if (!publicSiteSettings().indexable || !isPublicSearchPath(request.nextUrl.pathname))
    response.headers.set('X-Robots-Tag', PUBLIC_SITE.NO_INDEX);
  if (
    isSessionNavigationPath(request.nextUrl.pathname) ||
    isMarketingPath(request.nextUrl.pathname)
  )
    response.headers.set('Cache-Control', SESSION_NAVIGATION.NO_STORE);
  if (request.nextUrl.pathname.startsWith('/embed/')) {
    let local = false;
    try {
      const url = new URL(process.env['NEXT_PUBLIC_APP_URL'] ?? '');
      local = ['localhost', '127.0.0.1'].includes(url.hostname);
    } catch {
      local = false;
    }
    response.headers.set(
      'Content-Security-Policy',
      `frame-ancestors 'self' https:${local ? ' http://localhost:* http://127.0.0.1:*' : ''}`,
    );
  } else response.headers.set('X-Frame-Options', 'DENY');
  return response;
}
export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
