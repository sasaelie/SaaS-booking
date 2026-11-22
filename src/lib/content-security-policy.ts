import { isWebsitePreviewFrame } from '../config/website-preview';
export function contentSecurityPolicy(
  nonce: string,
  path: string,
  appUrl: string,
  development: boolean,
  publicBookingUrl?: string,
) {
  const scripts = `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ''}`;
  return [
    "default-src 'self'",
    scripts,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self'${development ? ' ws: wss:' : ''}`,
    `frame-src ${frameSources(path, publicBookingUrl)}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors(path, appUrl)}`,
  ].join('; ');
}
function frameSources(path: string, bookingUrl?: string) {
  if (!bookingUrl || !path.startsWith('/app/') || !path.endsWith('/partager')) return "'self'";
  try {
    const url = new URL(bookingUrl);
    return url.protocol === 'https:' && !url.username && !url.password
      ? `'self' ${url.origin}`
      : "'self'";
  } catch {
    return "'self'";
  }
}
function frameAncestors(path: string, appUrl: string) {
  if (isWebsitePreviewFrame(path)) return "'self'";
  if (!path.startsWith('/embed/')) return "'none'";
  try {
    const local = ['localhost', '127.0.0.1'].includes(new URL(appUrl).hostname);
    return `'self' https:${local ? ' http://localhost:* http://127.0.0.1:*' : ''}`;
  } catch {
    return "'self' https:";
  }
}
