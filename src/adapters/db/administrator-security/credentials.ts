import { sql } from 'drizzle-orm';
import { rows, type Executor } from '../transaction';
import type { PortalActor } from '../../../core/ports/portal-models';
import type { StoredPasskey } from '../../../core/ports/administrator-security';
export async function readCredentials(db: Executor, actor: PortalActor) {
  return rows<StoredPasskey & { label: string; createdAt: string } & Record<string, unknown>>(
    db,
    sql`
    SELECT credential_id AS id,public_key AS "publicKey",counter::float8 AS counter,transports,label,created_at::text AS "createdAt"
    FROM administrator_passkeys WHERE user_id=${actor.id} ORDER BY created_at,credential_id`,
  );
}
export async function auditSecurity(db: Executor, actor: PortalActor, action: string) {
  await db.execute(
    sql`INSERT INTO platform_audit(actor_user_id,action) VALUES(${actor.id},${action})`,
  );
}
