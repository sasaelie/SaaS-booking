export function contentSecurityPolicy(
  nonce: string,
  path: string,
  appUrl: string,
  development: boolean,
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
    "frame-src 'self'",
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    `frame-ancestors ${frameAncestors(path, appUrl)}`,
  ].join('; ');
}
function frameAncestors(path: string, appUrl: string) {
  if (!path.startsWith('/embed/')) return "'none'";
  try {
    const local = ['localhost', '127.0.0.1'].includes(new URL(appUrl).hostname);
    return `'self' https:${local ? ' http://localhost:* http://127.0.0.1:*' : ''}`;
  } catch {
    return "'self' https:";
  }
}
