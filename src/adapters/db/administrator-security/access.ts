import { sql } from 'drizzle-orm';
import type { PortalActor } from '../../../core/ports/portal-models';
import { ADMIN_SECURITY as C } from '../../../config/administrator-security';
import { ERROR_CODES } from '../../../config/constants';
import { failure } from '../../../lib/errors';
import { rows, required, type Executor } from '../transaction';
export async function securityAccess(db: Executor, actor: PortalActor) {
  const [state] = await rows<{ enabled: boolean; verified: boolean; fresh: boolean }>(
    db,
    sql`
    SELECT COALESCE(a.enabled,false) AS enabled,
      EXISTS(SELECT 1 FROM administrator_verified_sessions v JOIN "session" s ON s.id=v.session_id
        WHERE v.user_id=${actor.id} AND s."userId"=${actor.id} AND v.session_id=${actor.sessionId ?? ''}
        AND s."expiresAt">now() AND v.verified_at>now()-make_interval(secs=>${C.VERIFIED_SECONDS})) AS verified,
      EXISTS(SELECT 1 FROM administrator_verified_sessions v JOIN "session" s ON s.id=v.session_id
        WHERE v.user_id=${actor.id} AND s."userId"=${actor.id} AND v.session_id=${actor.sessionId ?? ''}
        AND s."expiresAt">now() AND v.verified_at>now()-make_interval(secs=>${C.FRESH_SECONDS})) AS fresh
    FROM (SELECT 1) seed LEFT JOIN administrator_security a ON a.user_id=${actor.id}`,
  );
  return state ?? { enabled: false, verified: false, fresh: false };
}
export async function requireSecuritySession(db: Executor, actor: PortalActor) {
  const found = await rows(
    db,
    sql`SELECT s.id FROM "session" s JOIN platform_operators p ON p.user_id=s."userId"
    WHERE s.id=${actor.sessionId ?? ''} AND s."userId"=${actor.id} AND s."expiresAt">now() FOR SHARE OF s,p`,
  );
  if (!found.length)
    required(failure(ERROR_CODES.UNAUTHORIZED, 'AdministratorSecurity', 'session'));
}
export async function requireAdministratorVerification(db: Executor, actor: PortalActor) {
  const access = await securityAccess(db, actor);
  if (access.enabled && !access.verified)
    required(failure(ERROR_CODES.MFA_REQUIRED, 'AdministratorSecurity', 'verification'));
}
export async function requireFreshVerification(db: Executor, actor: PortalActor) {
  if (!(await securityAccess(db, actor)).fresh)
    required(failure(ERROR_CODES.MFA_REQUIRED, 'AdministratorSecurity', 'freshVerification'));
}
export async function markVerified(db: Executor, actor: PortalActor) {
  await db.execute(sql`INSERT INTO administrator_verified_sessions(session_id,user_id,verified_at)
    VALUES(${actor.sessionId},${actor.id},now()) ON CONFLICT(session_id) DO UPDATE SET verified_at=now()`);
}
