import { clientSource } from '../../../../lib/client-source';
import { participant, participantCookie } from '../../../../composition/participant';
import { boundedJson } from '../../../../lib/http-body';
import { trustedOrigin } from '../../../../lib/trusted-origin';
import { HTTP_STATUS, PARTICIPANT, TIME } from '../../../../config/constants';
import { simulationExchange } from './simulation';
export async function POST(request: Request) {
  const app = participant();
  if (!app.ok) return Response.json({ success: false }, { status: HTTP_STATUS.UNAVAILABLE });
  if (!trustedOrigin(request, app.value.appUrl))
    return Response.json({ success: false }, { status: HTTP_STATUS.FORBIDDEN });
  const source = clientSource(request.headers);
  const limited = await app.value.limiter.accept(`participant-exchange:${source}`);
  if (!limited.ok) return Response.json({ success: false }, { status: HTTP_STATUS.RATE_LIMITED });
  const body = await boundedJson(request);
  const test = await simulationExchange(body.ok ? body.value : null);
  if (test) return test;
  const result = await app.value.access.exchange(
    body.ok ? body.value : null,
    participantCookie(request),
  );
  const headers = new Headers({
    'Cache-Control': 'private, no-store',
    'Referrer-Policy': 'no-referrer',
  });
  if (result.ok) {
    const secure = new URL(app.value.appUrl).protocol === 'https:' ? '; Secure' : '';
    const name = secure ? PARTICIPANT.SECURE_COOKIE : PARTICIPANT.COOKIE;
    headers.set(
      'Set-Cookie',
      `${name}=${result.value.browserToken}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${(PARTICIPANT.SESSION_HOURS * TIME.HOUR_MS) / TIME.SECOND_MS}${secure}`,
    );
  }
  return Response.json(
    result.ok ? { success: true, bookingId: result.value.bookingId } : { success: false },
    { status: result.ok ? HTTP_STATUS.OK : HTTP_STATUS.UNAUTHORIZED, headers },
  );
}
