import 'server-only';
import { getSessionCookie } from 'better-auth/cookies';
import { portal } from './portal';
export async function currentVisitor(headers: Headers) {
  if (!getSessionCookie(headers)) return null;
  const services = portal(headers);
  if (!services.ok) return null;
  const actor = await services.value.session.execute();
  return actor.ok ? actor.value : null;
}
