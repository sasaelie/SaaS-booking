import 'server-only';
import { runtime } from './runtime';
import { ParticipantAccessRepository } from '../adapters/db/participant/repository';
import { ParticipantAccessUseCase } from '../core/use-cases/participant-access.use-case';
import { verifySelfCancelToken, signSelfCancelToken } from '../core/domain/self-service-token';
import { DrizzleSelfBookingRepository } from '../adapters/db/drizzle-self-booking.repository';
import { PARTICIPANT, ERROR_CODES } from '../config/constants';
import { ok } from '../lib/result';
import { failure } from '../lib/errors';
import { trustedOrigin } from '../lib/trusted-origin';
export function participant() {
  const app = runtime();
  if (!app.ok) return app;
  const repository = new ParticipantAccessRepository(
    app.value.db,
    app.value.env.SELF_CANCEL_HMAC_SECRET,
    app.value.env.NEXT_PUBLIC_APP_URL,
  );
  return ok({
    access: new ParticipantAccessUseCase(repository),
    repository,
    limiter: app.value.limiter,
    appUrl: app.value.env.NEXT_PUBLIC_APP_URL,
  });
}
export function participantCookie(request: Request) {
  const name =
    new URL(request.url).protocol === 'https:' ? PARTICIPANT.SECURE_COOKIE : PARTICIPANT.COOKIE;
  const entry = request.headers
    .get('cookie')
    ?.split(';')
    .find((value) => value.trim().startsWith(`${name}=`));
  const token = entry?.trim().slice(name.length + 1);
  return token && /^[a-f0-9]{64}$/.test(token) ? token : null;
}
export async function resolveParticipantToken(token: string, request: Request) {
  const app = runtime();
  if (!app.ok) return app;
  if (!token.startsWith(PARTICIPANT.MANAGE_PREFIX)) {
    const payload = await verifySelfCancelToken(
      token,
      app.value.env.SELF_CANCEL_HMAC_SECRET,
      new Date(),
    );
    if (!payload.ok) return payload;
    const access = await new DrizzleSelfBookingRepository(app.value.db).read(payload.value);
    return access.ok ? ok(token) : access;
  }
  const services = participant();
  if (!services.ok) return services;
  if (!trustedOrigin(request, services.value.appUrl))
    return failure(ERROR_CODES.UNAUTHORIZED, 'Participant', 'origin');
  const payload = await services.value.access.authorize(
    participantCookie(request) ?? '',
    token.slice(PARTICIPANT.MANAGE_PREFIX.length),
  );
  return payload.ok
    ? signSelfCancelToken(payload.value, app.value.env.SELF_CANCEL_HMAC_SECRET)
    : payload;
}
