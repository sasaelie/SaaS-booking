export function trustedOrigin(request: Request, appUrl: string): boolean {
  try {
    const origin = request.headers.get('origin');
    return origin !== null && new URL(origin).origin === new URL(appUrl).origin;
  } catch {
    return false;
  }
}
